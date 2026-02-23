#!/bin/bash

# Aggressive Gradle cache cleanup
# Use this if the regular cleanup doesn't work

echo "Stopping all Gradle daemons..."
cd "$(dirname "$0")/android" 2>/dev/null || cd android 2>/dev/null || true
./gradlew --stop 2>/dev/null || true

echo "Cleaning ALL Gradle caches (this will take longer on next build)..."

# Clean entire Gradle 8.4 cache
rm -rf ~/.gradle/caches/8.4

# Clean jars cache
rm -rf ~/.gradle/caches/jars-9

# Clean Gradle daemon files
rm -rf ~/.gradle/daemon

# Clean local project build directories
cd "$(dirname "$0")" 2>/dev/null || true
rm -rf android/.gradle android/app/build android/build android/.idea

echo "All Gradle caches cleaned! The next build will take longer as everything will be re-downloaded."
echo "Try running 'npm run android' again."
