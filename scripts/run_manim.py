import subprocess

def run_manim(script_path, output_path):
    try:
        result = subprocess.run(['manim', '-pql', script_path, '-o', output_path], capture_output=True, text=True, check=True)
        print('Manim output:', result.stdout)
    except subprocess.CalledProcessError as e:
        print(f'Error running Manim: {e.stderr}')
        raise

if __name__ == '__main__':
    script_path = '/Users/user/fuck_you/temp_scripts/temp_script.py'
    output_path = '/Users/user/fuck_you/output/temp_manim.mp4'
    run_manim(script_path, output_path)
