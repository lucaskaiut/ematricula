<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pagamento confirmado</title>
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a;">
    <p>Olá, {{ $studentName }}</p>
    <p>Seu pagamento foi confirmado em {{ $companyName }}.</p>
    <ul>
        <li>Número da fatura: {{ $invoiceId }}</li>
        <li>Valor: {{ $amountDisplay }}</li>
        <li>Vencimento: {{ $dueDateDisplay }}</li>
        <li>Data da confirmação: {{ $confirmedAtDisplay }}</li>
    </ul>
    <p>Obrigado.</p>
</body>
</html>
