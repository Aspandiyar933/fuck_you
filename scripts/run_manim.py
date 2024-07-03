import subprocess
import sys
import os

script_path = sys.argv[1]
output_path = sys.argv[2]

subprocess.run(['manim', '-pql', script_path, '-o', output_path])
