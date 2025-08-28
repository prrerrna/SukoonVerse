# run_tests.py: A simple script to test the crisis prefilter against a set of phrases.
import json
import os
import sys

# This script reads test cases from a JSON file and runs them through the
# crisis prefilter to check if the output matches the expected result.

# To run this script, navigate to the 'backend' directory in your terminal
# and execute: python tests/run_tests.py

# Adjust the Python path to include the parent directory ('backend')
# so that we can import modules from the 'app' package.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.safety.prefilter import check_for_crisis

# Path to the JSON file with test phrases
TEST_FILE_PATH = os.path.join(os.path.dirname(__file__), 'test_prefilter.json')

# --- Test Runner Logic ---
# This is a simple, procedural script with no functions or classes.
if __name__ == "__main__":
    try:
        with open(TEST_FILE_PATH, 'r', encoding='utf-8') as f:
            test_cases = json.load(f)
    except FileNotFoundError:
        print(f"Error: Test file not found at {TEST_FILE_PATH}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {TEST_FILE_PATH}")
        sys.exit(1)

    print("--- Running Crisis Prefilter Tests ---")
    
    passed_count = 0
    failed_count = 0

    for i, test in enumerate(test_cases):
        text = test.get("text")
        expected = test.get("is_crisis_expected")

        if text is None or expected is None:
            print(f"\n[SKIP] Test case {i+1} is malformed.")
            continue

        # Run the prefilter check
        is_crisis, reason = check_for_crisis(text)

        # Check if the result matches the expectation
        if is_crisis == expected:
            status = "PASS"
            passed_count += 1
        else:
            status = "FAIL"
            failed_count += 1
        
        print(f"\n[{status}] Test {i+1}: '{text}'")
        print(f"  - Expected: {'CRISIS' if expected else 'NOT CRISIS'}")
        print(f"  - Got:      {'CRISIS' if is_crisis else 'NOT CRISIS'}")

    print("\n--- Test Summary ---")
    print(f"Total Tests: {len(test_cases)}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {failed_count}")
    print("--------------------")

    if failed_count > 0:
        print("\nSome tests failed. Review the output above.")
        sys.exit(1)
    else:
        print("\nAll tests passed successfully!")
        sys.exit(0)
