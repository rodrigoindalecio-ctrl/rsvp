@echo off
title Tunnel localhost.run
echo Abrindo tunnel para o servidor local (Porta 3000)...
ssh -R 80:localhost:3000 nokey@localhost.run
pause
