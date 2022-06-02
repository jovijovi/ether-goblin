#!/usr/bin/env bash

set -e

COMMAND=${1}
SERVICE_NAME=${2}

# Print the usage message
function printHelp() {
  echo "Setting up a development environment out-of-the-box."
  echo
  echo "Usage: "
  echo "  ./dev.sh COMMAND"
  echo
  echo "Commands:"
  echo "  up        Setting up a development environment or a service"
  echo "  down      Shut down the development environment"
  echo "  stop      Stop a service in the development environment"
  echo
  echo "Examples:"
  echo "  ./dev.sh up"
  echo "  ./dev.sh down"
  echo "  ./dev.sh up postgres"
  echo "  ./dev.sh stop postgres"
}

if [[ "${COMMAND}" == "up" ]]; then
  echo "## Creating dev env..."
  docker-compose -f dev.yaml up -d ${SERVICE_NAME}
elif [[ "${COMMAND}" == "down" ]]; then
  echo "## Shutting down dev env..."
  docker-compose -f dev.yaml down
elif [[ "${COMMAND}" == "stop" ]]; then
  echo "## Stopping service..."
  docker-compose -f dev.yaml stop ${SERVICE_NAME}
else
  printHelp
  exit 1
fi

echo "## Done."

docker ps
