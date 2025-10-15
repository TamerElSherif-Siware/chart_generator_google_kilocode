# Generating COOKIE_KEY for session security

## INSTALL pyOpenSLL Using pip if you python
pip install pyOpenSSL

Run one of the following commands in your terminal to generate a strong random key:

## Using pyOpenSSL (Python)
python -c "import secrets; import base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"

## Using OpenSSL
openssl rand -base64 32

## Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Copy the output and paste it as the COOKIE_KEY value in your `.env` file.