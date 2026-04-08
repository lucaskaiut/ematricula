<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Lembrete de pagamento</title>
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
    <p>Olá, {{ $studentName }}</p>
    <p>Hoje é o vencimento da sua fatura em {{ $companyName }}. Lembrete de pagamento:</p>
    <ul>
        <li>Número da fatura: {{ $invoiceId }}</li>
        <li>Valor: {{ $amountDisplay }}</li>
        <li>Vencimento: {{ $dueDateDisplay }}</li>
    </ul>
    @if ($paymentUrl)
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 1.25rem 0;">
            <tr>
                <td style="border-radius: 8px; background: #2563eb;">
                    <a href="{{ $paymentUrl }}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">Pagar agora</a>
                </td>
            </tr>
        </table>
    @endif
</body>
</html>
