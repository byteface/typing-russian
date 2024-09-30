#!/bin/bash

ROOT='/home/ubuntu/typing'

echo 'Updating files on the server:'

scp -F ~/.ssh/config ./index.html portfolio:$ROOT
scp -F ~/.ssh/config ./main.css portfolio:$ROOT
scp -F ~/.ssh/config ./master.js portfolio:$ROOT
# scp -F ~/.ssh/config -r ./data portfolio:$ROOT

echo 'DONE'