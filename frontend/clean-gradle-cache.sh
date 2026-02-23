#!/bin/bash

# Script to clean corrupted Gradle cache
# This fixes various Gradle cache corruption issues

echo "Stopping Gradle daemon..."
cd "$(dirname "$0")/android" 2>/dev/null || cd android 2>/dev/null || true
./gradlew --stop 2>/dev/null || true

echo "Cleaning corrupted Gradle cache..."

# Remove the specific corrupted Kotlin DSL script cache entry
rm -rf ~/.gradle/caches/8.4/kotlin-dsl/scripts/b54e524daeb7fcb3c552e7cba159f002

# Remove corrupted JARs cache (referenced in the error)
rm -rf ~/.gradle/caches/jars-9/f6a53482ff348e4f7cef57f9a1bb8b20

# Remove corrupted generated Gradle JARs (fixes FileExistsException)
rm -rf ~/.gradle/caches/8.4/generated-gradle-jars

# Clean the entire Kotlin DSL cache
rm -rf ~/.gradle/caches/8.4/kotlin-dsl

# Clean the entire jars-9 cache if needed
rm -rf ~/.gradle/caches/jars-9

# Clean local project build cache
cd "$(dirname "$0")" 2>/dev/null || true
rm -rf android/.gradle android/app/build android/build

# Nuclear option: clean entire 8.4 cache (uncomment if above doesn't work)
# rm -rf ~/.gradle/caches/8.4

echo "Gradle cache cleaned! Try running 'npm run android' again."
