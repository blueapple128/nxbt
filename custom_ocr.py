from pynput.keyboard import Events, Key, Controller
from PIL import Image
import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = 'foo'
import pygame.camera, pygame.image
import subprocess, math, time, shlex

streaming = False
try:
    from PIL import ImageGrab
    linux = False
except ImportError:
    linux = True

def run(command):
    return subprocess.check_output(shlex.split(command)).decode("utf-8").replace('\r', '')

def say(text):
    print(text)
    if linux:
        try:
            run(f'say "{text}"')
        except subprocess.CalledProcessError:
            pass  # say always(?) exits 1 for some reason
    else:
        # https://stackoverflow.com/questions/1040655/ms-speech-from-command-line
        subprocess.run(f'mshta vbscript:Execute("CreateObject(""SAPI.SpVoice"").Speak(""{text}"")(window.close)")')

def screenshot(cap, cap_name):
    global streaming

    if not streaming:
        if linux:
            try:
                run(f'ffmpeg -i {cap_name} -vf "select=eq(n\\,5)" -frames:v 1 screen.png -y')
            except subprocess.CalledProcessError:
                streaming = True
        else:
            cap.start()
            try:
                im = cap.get_image()
            except SystemError:
                streaming = True
            if not streaming:
                w, h = im.get_size()
                if w != 1920 or h != 1080:
                    say(f"Error, video source is {w}x{h} instead of 1920x1080")
                    return False
                else:
                    pygame.image.save(im, "screen.png")

    if streaming:
        if linux:
            run('magick import -window "Fullscreen Projector (Source) - Video Capture Device (V4L2)" screen.png')
        else:
            controller = Controller()
            with controller.pressed(Key.alt):
                time.sleep(0.1)
                controller.press(Key.print_screen)
                controller.release(Key.print_screen)
                time.sleep(0.1)

            im = ImageGrab.grabclipboard()
            w, h = im.size
            if w != 1920 or h != 1080:
                say(f"Wrong screenshot size; got {w}x{h} instead of 1920x1080")
                return False
            else:
                im.save("screen.png")

    return True

def objective():
    raw_tessout = run("tesseract --psm 11 screen.png -")
    if "Map" in raw_tessout:
        objective_map()
    else:
        objective_minimap()

# TODO document where these different color thresholds are coming from

def objective_map():
    sparse_output = run('magick screen.png -color-threshold "RGB(215,135,40)-RGB(240,155,75)" -fill transparent -draw "color 0,0 floodfill" -transparent white sparse-color:')
    sparse_output = sparse_output.split()

    if not sparse_output:
        say("No exclamation point found")
        return
    if len(sparse_output) > 175 and len(sparse_output) < 225:
        say("Map cursor appears to be on top of the objective")
        return
    if len(sparse_output) < 225 or len(sparse_output) > 275:
        say(f"Error, tried to find between 225-275 pixels matching an exclamation point but instead got {len(sparse_output)}")
        return

    left,  top,    *_ = sparse_output[1].split(',')
    right, bottom, *_ = sparse_output[-1].split(',')
    left = int(left)
    top = int(top)
    right = int(right)
    bottom = int(bottom)
    if (right - left > 10):
        say(f"Error, expected horizontal size no more than 10 pixels but instead got {right - left}")
        return
    if (bottom - top < 25 or bottom - top > 35):
        say(f"Error, expecting vertical size between 25-35 but instead got {bottom - top}")
        return
    x = round(((left + right)/2 - 960)/3)
    y = round(((top + bottom)/2 - 498)/3)

    say(f"About {abs(x)} steps {'right' if x > 0 else 'left'}, {abs(y)} steps {'down' if y > 0 else 'up'}")

def objective_minimap():
    sparse_output = run('magick screen.png -crop 360x360+1560+720 -color-threshold "RGB(230,135,25)-RGB(250,195,50)" -transparent black sparse-color:')
    sparse_output = sparse_output.split()

    if len(sparse_output) < 10:
        say("No objective marker found")
        return
    if len(sparse_output) > 2000:
        say(f"Error, expected 2000 pixels or fewer but instead got {len(sparse_output)}")
        return

    sparse_output = [item.split(',')[:2] for item in sparse_output]

    xs = sorted([int(pair[0]) for pair in sparse_output])
    top_x = xs[0]
    middle_x = xs[len(sparse_output)//2]
    bottom_x = xs[-1]

    top_y = int(sparse_output[0][1])
    middle_y = int(sparse_output[len(sparse_output)//2][1])
    bottom_y = int(sparse_output[-1][1])

    diff1 = middle_x - top_x
    diff2 = bottom_x - middle_x
    if (diff1 < 20 and diff2 < 20) or (diff1 > 30 and diff2 > 30):
        say(f"Warning, found x-coordinate minimap noise {diff1} {diff2}")
        x = round((middle_x - 180)/3)
    elif diff1 < diff2:
        x = round((top_x - 155)/3)
    else:
        x = round((bottom_x - 205)/3)

    diff1 = middle_y - top_y
    diff2 = bottom_y - middle_y
    if (diff1 < 20 and diff2 < 20) or (diff1 > 30 and diff2 > 30):
        say(f"Warning, found y-coordinate minimap noise {diff1} {diff2}")
        y = round((middle_y - 138)/3)
    elif diff1 < diff2:
        y = round((top_y - 113)/3)
    else:
        y = round((bottom_y - 163)/3)

    say(f"About {abs(x)} steps {'right' if x > 0 else 'left'}, {abs(y)} steps {'down' if y > 0 else 'up'}")

def bearing():
    run('magick screen.png -crop 360x360+1560+720 -color-threshold "RGB(19,161,70)-RGB(29,171,80)" -negate ocr.png')

    tessout = run("tesseract --psm 10 ocr.png - makebox")
    tessout = tessout.split('\n')[:-1]
    if not tessout:
        say("Compass not found")
        return

    found = False
    for line in tessout:
        match, left, bottom, right, top, _ = line.split()
        if match != 'N':
            continue
        found = True

        left = int(left)
        bottom = int(bottom)
        right = int(right)
        top = int(top)
        if (right - left < 10 or right - left > 20):
            say(f"Error, expected horizontal size between 10-20 but instead got {right - left}")
            return
        if (top - bottom < 10 or top - bottom > 20):
            say(f"Error, expected vertical size between 10-20 but instead got {top - bottom}")
            return
        x = (left + right)/2 - 180
        y = (top + bottom)/2 - 180

        # experimental values:
        # north is (   0.5,  146)
        # south is (  -2.5, -146)
        # west  is (-145.5,    3)
        # east  is ( 146.5,    0)

        dist = math.sqrt(x*x + y*y)
        if dist < 130 or dist > 160:
            say(f"Error, expected distance between 130-160 but instead got {dist}")
            return
        if x == 0 and y > 0:
            angle = 90
        elif x == 0 and y < 0:
            angle = 270
        else:
            atan = math.atan(y/x) * 360/math.tau
            if x > 0 and y >= 0:
                angle = atan
            elif x > 0 and y < 0:
                angle = atan + 360
            elif x < 0:
                angle = atan + 180

        # angle WHERE NORTH POINTS to bearing conversion
        #   0 degree angle = 270 degree bearing (west)
        #  45 degree angle = 315 degree bearing (northwest)
        #  90 degree angle =   0 degree bearing (north)
        # 135 degree angle =  45 degree bearing (northeast)
        # 180 degree angle =  90 degree bearing (east)
        # 225 degree angle = 135 degree bearing (southeast)
        # 270 degree angle = 180 degree bearing (south)
        # 315 degree angle = 225 degree bearing (southwest)
        bearing = round((angle + 270) % 360)
        say(bearing)

    if not found:
        say(f"Compass not found but found some different text {match}")

def main():
    pygame.camera.init()
    cameras = pygame.camera.list_cameras()
    cameras = [cam for cam in cameras if 'webcam' not in cam.lower()]
    if len(cameras) == 0:
        print("No video sources found other than webcams")
        return
    elif len(cameras) == 1:
        cap_name = cameras[0]
    else:
        print("Multiple video sources found, use which one?")
        for i in range(len(cameras)):
            print(f"{i}: {cameras[i]}")
        while True:
            try:
                user_input = int(input(f"Enter a number 0 to {len(cameras)-1}: "))
            except ValueError:
                pass
            if user_input >= 0 and user_input <= len(cameras)-1:
                break
        cap_name = cameras[user_input]
    cap = pygame.camera.Camera(cap_name)

    with Events() as events:
        ctrl_held = False
        shift_held = False
        print("Now listening for hotkeys (Ctrl+Shift+number)")

        for event in events:
            if event.__class__ == Events.Press:
                if event.key == Key.ctrl_l or event.key == Key.ctrl_r:
                    ctrl_held = True
                elif event.key == Key.shift:
                    shift_held = True
                elif ctrl_held and shift_held:
                    if str(event.key) == "'#'" or str(event.key) == '<51>':
                        if screenshot(cap, cap_name):
                            bearing()
                    elif str(event.key) == "'$'" or str(event.key) == '<52>':
                        if screenshot(cap, cap_name):
                            objective()
            elif event.__class__ == Events.Release:
                if event.key == Key.ctrl_l or event.key == Key.ctrl_r:
                    ctrl_held = False
                if event.key == Key.shift:
                    shift_held = False


if __name__ == '__main__':
    main()
