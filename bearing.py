from pynput.keyboard import Events, Key, Controller
from PIL import Image, ImageGrab
import subprocess
import pytesseract
import math
import time

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract"

def say(text):
    print(text)
    # https://stackoverflow.com/questions/1040655/ms-speech-from-command-line
    subprocess.run(f'mshta vbscript:Execute("CreateObject(""SAPI.SpVoice"").Speak(""{text}"")(window.close)")')

def bearing():
    controller = Controller()
    with controller.pressed(Key.alt):
        time.sleep(0.1)
        controller.press(Key.print_screen)
        controller.release(Key.print_screen)
        time.sleep(0.1)

        im = ImageGrab.grabclipboard()
        w, h = im.size
        if w != 1920 or h != 1080:
            say(f"Wrong screenshot size; expected 1920x1080 but instead got {w}x{h}")
            return
        im.crop((1920-360, 1080-360, 1920, 1080)).save("crop.png")

        subprocess.run('magick crop.png -color-threshold "RGB(19,161,70)-RGB(29,171,80)" -negate ocr.png')

        tessout = pytesseract.image_to_boxes("ocr.png", config="--psm 10")
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
                say(f"Error, expected vertical size between 10-20 but instead got {right - left}")
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
    with Events() as events:
        ctrl_held = False
        shift_held = False
        print("Now listening for bearing hotkey (Ctrl+Shift+3)")

        for event in events:
            if event.__class__ == Events.Press:
                if event.key == Key.ctrl_l or event.key == Key.ctrl_r:
                    ctrl_held = True
                elif event.key == Key.shift:
                    shift_held = True
                elif ctrl_held and shift_held and str(event.key) == '<51>':
                    bearing()
            elif event.__class__ == Events.Release:
                if event.key == Key.ctrl_l or event.key == Key.ctrl_r:
                    ctrl_held = False
                if event.key == Key.shift:
                    shift_held = False


if __name__ == '__main__':
    main()
