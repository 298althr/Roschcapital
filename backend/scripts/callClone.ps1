# PowerShell script to call the clone-user API endpoint
$API_BASE = "https://gatwickbank-production.up.railway.app/api/v1"

Write-Host "Step 1: Authenticating as admin..."

# Step 1: Login
$loginBody = @{
    email = "jonod@gmail.com"
    password = "Password123!"
} | ConvertTo-Json

$step1Response = Invoke-RestMethod -Uri "$API_BASE/auth/login/step1" -Method Post -Body $loginBody -ContentType "application/json"

Write-Host "Step 1 successful"

# Step 2: Security question
Write-Host "Step 2: Answering security question..."

$step2Body = @{
    email = "jonod@gmail.com"
    answer = "fluffy"
} | ConvertTo-Json

$step2Response = Invoke-RestMethod -Uri "$API_BASE/auth/login/step2" -Method Post -Body $step2Body -ContentType "application/json"

$token = $step2Response.token
Write-Host "Got authentication token"

# Step 3: Call clone-user endpoint
Write-Host "Step 3: Cloning user..."

$cloneBody = @{
    sourceEmail = "brokardw@gmail.com"
    targetEmail = "brokardwilliams@gmail.com"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $cloneResponse = Invoke-RestMethod -Uri "$API_BASE/mybanker/clone-user" -Method Post -Body $cloneBody -Headers $headers
    
    Write-Host ""
    Write-Host "SUCCESS! User cloned successfully!"
    Write-Host ""
    Write-Host "Results:"
    Write-Host "  Source: brokardw@gmail.com"
    Write-Host "  Target: brokardwilliams@gmail.com"
    Write-Host "  New User ID: $($cloneResponse.newUserId)"
    Write-Host ""
    Write-Host "Cloned Data:"
    Write-Host "  Accounts: $($cloneResponse.stats.accounts)"
    Write-Host "  Transactions: $($cloneResponse.stats.transactions)"
    Write-Host "  Debit Cards: $($cloneResponse.stats.debitCards)"
    Write-Host "  Credit Cards: $($cloneResponse.stats.creditCards)"
    Write-Host "  KYC Documents: $($cloneResponse.stats.kycDocuments)"
    Write-Host "  Loans: $($cloneResponse.stats.loans)"
    Write-Host "  Beneficiaries: $($cloneResponse.stats.beneficiaries)"
    Write-Host "  Recurring Payments: $($cloneResponse.stats.recurringPayments)"
    Write-Host ""
    Write-Host "Note: $($cloneResponse.note)"
    Write-Host ""
    Write-Host "Login: brokardwilliams@gmail.com"
    Write-Host "Password: Same as brokardw@gmail.com"
} catch {
    Write-Host ""
    Write-Host "ERROR cloning user:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
