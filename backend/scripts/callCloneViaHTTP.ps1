# PowerShell script to call the clone-user API endpoint
$API_BASE = "https://gatwickbank-production.up.railway.app/api/v1"

Write-Host "`n🔐 Step 1: Authenticating as admin..." -ForegroundColor Cyan

# Step 1: Login
$loginBody = @{
    email = "jonod@gmail.com"
    password = "Password123!"
} | ConvertTo-Json

$step1Response = Invoke-RestMethod -Uri "$API_BASE/auth/login/step1" -Method Post -Body $loginBody -ContentType "application/json"

Write-Host "✅ Step 1 successful" -ForegroundColor Green

# Step 2: Security question
Write-Host "`n🔐 Step 2: Answering security question..." -ForegroundColor Cyan

$step2Body = @{
    email = "jonod@gmail.com"
    answer = "fluffy"
} | ConvertTo-Json

$step2Response = Invoke-RestMethod -Uri "$API_BASE/auth/login/step2" -Method Post -Body $step2Body -ContentType "application/json"

$token = $step2Response.token
Write-Host "✅ Got authentication token" -ForegroundColor Green

# Step 3: Call clone-user endpoint
Write-Host "`n🔄 Step 3: Cloning user from brokardw@gmail.com to brokardwilliams@gmail.com..." -ForegroundColor Cyan

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
    
    Write-Host "`n============================================================" -ForegroundColor Green
    Write-Host "✅ USER CLONING COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "`n📊 Results:" -ForegroundColor Cyan
    Write-Host "   Source: brokardw@gmail.com"
    Write-Host "   Target: brokardwilliams@gmail.com"
    Write-Host "   New User ID: $($cloneResponse.newUserId)"
    Write-Host "`n📈 Cloned Data:" -ForegroundColor Cyan
    Write-Host "   ✅ Accounts: $($cloneResponse.stats.accounts)"
    Write-Host "   ✅ Transactions: $($cloneResponse.stats.transactions)"
    Write-Host "   ✅ Debit Cards: $($cloneResponse.stats.debitCards)"
    Write-Host "   ✅ Credit Cards: $($cloneResponse.stats.creditCards)"
    Write-Host "   ✅ KYC Documents: $($cloneResponse.stats.kycDocuments)"
    Write-Host "   ✅ Loans: $($cloneResponse.stats.loans)"
    Write-Host "   ✅ Beneficiaries: $($cloneResponse.stats.beneficiaries)"
    Write-Host "   ✅ Recurring Payments: $($cloneResponse.stats.recurringPayments)"
    Write-Host "`n⚠️  $($cloneResponse.note)" -ForegroundColor Yellow
    Write-Host "`n🔑 Login Credentials:" -ForegroundColor Cyan
    Write-Host "   Email: brokardwilliams@gmail.com"
    Write-Host "   Password: Same as brokardw@gmail.com"
    Write-Host "`n============================================================" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Error cloning user:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
