<?php

declare(strict_types=1);

namespace App\Modules\Payment\Infrastructure\Gateways;

use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Domain\DTOs\CreatePaymentData;
use App\Modules\Payment\Domain\DTOs\PaymentResponse;
use App\Modules\Payment\Domain\Enums\PaymentStatus;
use App\Modules\Payment\Domain\Models\Payment;
use App\Modules\Person\Domain\Models\Person;
use App\Modules\Setting\Domain\Services\TenantSettingsService;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AsaasPayment implements PaymentGatewayInterface
{
    public function __construct(
        private readonly TenantSettingsService $tenantSettings,
    ) {}

    public function createPayment(CreatePaymentData $data): PaymentResponse
    {
        $companyId = $data->companyId;
        $apiKey = $this->requireApiKey($this->tenantSettings->getValue($companyId, 'asaas.api_key'));
        $environment = (string) ($this->tenantSettings->getValue($companyId, 'asaas.environment') ?? 'sandbox');
        $baseUrl = $this->resolveBaseUrl($environment);

        $dueDaysRaw = $this->tenantSettings->getValue($companyId, 'invoice.due_days');
        $days = is_numeric($dueDaysRaw) ? (int) $dueDaysRaw : 7;
        $days = max(0, $days);
        $dueDate = now()->startOfDay()->addDays($days)->format('Y-m-d');

        $invoice = Invoice::query()
            ->with(['subscription.enrollment.student'])
            ->where('company_id', $companyId)
            ->findOrFail($data->invoiceId);

        $student = $invoice->subscription?->enrollment?->student;
        if ($student === null) {
            throw ValidationException::withMessages([
                'invoice' => ['É necessário um aluno vinculado à fatura para cobrança pelo Asaas.'],
            ]);
        }

        $customerId = $this->resolveOrCreateCustomer($baseUrl, $apiKey, $student);

        $payload = [
            'customer' => $customerId,
            'billingType' => 'UNDEFINED',
            'value' => round((float) $data->amount, 2),
            'dueDate' => $dueDate,
            'description' => 'Fatura #'.$invoice->id,
            'externalReference' => (string) $invoice->id,
        ];

        $response = $this->http($baseUrl, $apiKey)->post('/payments', $payload);

        $this->throwIfFailed($response, 'Não foi possível criar a cobrança no Asaas.');

        $body = $response->json();
        $id = (string) ($body['id'] ?? '');
        $invoiceUrl = (string) ($body['invoiceUrl'] ?? '');
        if ($id === '' || $invoiceUrl === '') {
            throw ValidationException::withMessages([
                'asaas' => ['Resposta inválida da API do Asaas.'],
            ]);
        }

        $status = $this->mapAsaasPaymentStatus((string) ($body['status'] ?? 'PENDING'));

        return new PaymentResponse(
            gatewayPaymentId: $id,
            paymentUrl: $invoiceUrl,
            status: $status,
        );
    }

    public function getPaymentStatus(string $paymentId, Payment $payment): PaymentStatus
    {
        $companyId = (int) $payment->company_id;
        $apiKey = $this->requireApiKey($this->tenantSettings->getValue($companyId, 'asaas.api_key'));
        $environment = (string) ($this->tenantSettings->getValue($companyId, 'asaas.environment') ?? 'sandbox');
        $baseUrl = $this->resolveBaseUrl($environment);

        $response = $this->http($baseUrl, $apiKey)->get('/payments/'.$paymentId);

        $this->throwIfFailed($response, 'Não foi possível consultar o pagamento no Asaas.');

        $body = $response->json();

        return $this->mapAsaasPaymentStatus((string) ($body['status'] ?? ''));
    }

    private function http(string $baseUrl, string $apiKey): PendingRequest
    {
        return Http::baseUrl($baseUrl)
            ->withHeaders([
                'access_token' => $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->timeout(60);
    }

    private function resolveBaseUrl(string $environment): string
    {
        return match ($environment) {
            'production' => 'https://api.asaas.com/v3',
            default => 'https://api-sandbox.asaas.com/v3',
        };
    }

    private function requireApiKey(mixed $value): string
    {
        if (! is_string($value) || trim($value) === '') {
            throw ValidationException::withMessages([
                'asaas' => ['Configure a chave de API do Asaas nas configurações da empresa.'],
            ]);
        }

        return trim($value);
    }

    private function resolveOrCreateCustomer(string $baseUrl, string $apiKey, Person $student): string
    {
        $externalRef = 'person:'.$student->id;

        $listResponse = $this->http($baseUrl, $apiKey)->get('/customers', [
            'externalReference' => $externalRef,
            'limit' => 1,
        ]);

        $this->throwIfFailed($listResponse, 'Não foi possível consultar o cliente no Asaas.');

        $list = $listResponse->json();
        $first = is_array($list) ? ($list['data'][0] ?? null) : null;
        if (is_array($first) && isset($first['id']) && is_string($first['id']) && $first['id'] !== '') {
            return $first['id'];
        }

        logger()->info($student->cpf);

        $createBody = array_filter([
            'name' => $student->full_name,
            'email' => $student->email,
            'phone' => $student->phone !== '' ? $student->phone : null,
            'cpfCnpj' => $student->cpf !== null && $student->cpf !== '' ? $student->cpf : null,
            'externalReference' => $externalRef,
            'notificationDisabled' => true,
        ], static fn (mixed $v) => $v !== null && $v !== '');

        $createResponse = $this->http($baseUrl, $apiKey)->post('/customers', $createBody);

        $this->throwIfFailed($createResponse, 'Não foi possível cadastrar o cliente no Asaas.');

        $created = $createResponse->json();
        $id = is_array($created) ? (string) ($created['id'] ?? '') : '';
        if ($id === '') {
            throw ValidationException::withMessages([
                'asaas' => ['Resposta inválida ao cadastrar cliente no Asaas.'],
            ]);
        }

        return $id;
    }

    private function throwIfFailed(Response $response, string $fallbackMessage): void
    {
        if ($response->successful()) {
            return;
        }

        $json = $response->json();
        $errors = is_array($json) ? ($json['errors'] ?? null) : null;
        $first = '';
        if (is_array($errors) && $errors !== []) {
            $item = $errors[0] ?? null;
            if (is_array($item)) {
                $first = (string) ($item['description'] ?? '');
            }
        }

        $message = $first !== '' ? $first : $fallbackMessage;

        throw ValidationException::withMessages([
            'asaas' => [$message],
        ]);
    }

    private function mapAsaasPaymentStatus(string $asaasStatus): PaymentStatus
    {
        $normalized = strtoupper($asaasStatus);

        return match (true) {
            in_array($normalized, ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'], true) => PaymentStatus::Approved,
            in_array($normalized, ['REFUNDED'], true) => PaymentStatus::Cancelled,
            default => PaymentStatus::Pending,
        };
    }
}
