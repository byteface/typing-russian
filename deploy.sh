#!/bin/bash

ROOT='/home/ubuntu/typing'

echo 'Updating files on the server:'

scp -F ~/.ssh/config ./index.html portfolio:$ROOT
scp -F ~/.ssh/config -r ./data portfolio:$ROOT

echo 'Resarting service:'
ssh portfolio 'sudo systemctl restart typing'

echo 'DONE'