<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('Documentação da API') }} — {{ config('app.name') }}</title>
    <style>
        html, body { margin: 0; min-height: 100%; height: 100%; }
    </style>
</head>
<body>
    <script
        id="api-reference"
        data-url="{{ url('/openapi.yaml') }}"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.116/dist/browser/standalone.js"></script>
</body>
</html>
