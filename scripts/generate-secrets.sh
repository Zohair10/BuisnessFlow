#!/bin/bash

echo "=== Buisness Flow - Secret Generation ==="
echo ""
echo "AUTH_SECRET=$(openssl rand -base64 32)"
echo ""
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo ""
echo "Copy these values to your .env file"
