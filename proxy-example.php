<?php
/**
 * Simple PHP Proxy for Make.com Webhook
 *
 * Host this on a domain that Akeneo allows (e.g., your company domain)
 * Then point the extension to this proxy instead of Make.com directly
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Your Make.com webhook URL
$makeWebhookUrl = 'https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29';

// Forward the request to Make.com
$ch = curl_init($makeWebhookUrl);

// Get the raw POST data
$postData = file_get_contents('php://input');

// Set cURL options
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'application/json'),
    ],
]);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return Make.com's response
http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
