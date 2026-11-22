# Instaluje w profilu użytkownika (bez praw administratora) statyczne odmiany fontów
# Space Grotesk i IBM Plex, żeby PowerPoint i Word rysowały slajdy tym samym krojem
# co aplikacja. Uruchomienie: python tools/install_fonts.py
import os, shutil, urllib.request, winreg
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

TMP = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'asd1m202-fonts')
DEST = os.path.join(os.environ['LOCALAPPDATA'], 'Microsoft', 'Windows', 'Fonts')
os.makedirs(TMP, exist_ok=True)
os.makedirs(DEST, exist_ok=True)

SRC = {
    'SpaceGrotesk': 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf',
    'IBMPlexSans': 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsans/IBMPlexSans%5Bwdth,wght%5D.ttf',
    'IBMPlexMono': 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf',
}
# (plik źródłowy, waga, nazwa rodziny, nazwa odmiany, plik docelowy)
WANTED = [
    ('SpaceGrotesk', 400, 'Space Grotesk', 'Regular', 'SpaceGrotesk-Regular.ttf'),
    ('SpaceGrotesk', 700, 'Space Grotesk', 'Bold', 'SpaceGrotesk-Bold.ttf'),
    ('IBMPlexSans', 400, 'IBM Plex Sans', 'Regular', 'IBMPlexSans-Regular.ttf'),
    ('IBMPlexSans', 600, 'IBM Plex Sans SemiBold', 'Regular', 'IBMPlexSans-SemiBold.ttf'),
    ('IBMPlexMono', None, 'IBM Plex Mono', 'Regular', 'IBMPlexMono-Regular.ttf'),
]


def download(key):
    path = os.path.join(TMP, key + '.ttf')
    if not os.path.exists(path):
        urllib.request.urlretrieve(SRC[key], path)
    return path


def set_name(font, family, style):
    full = family if style == 'Regular' else family + ' ' + style
    ps = full.replace(' ', '')
    for rec in font['name'].names:
        if rec.nameID == 1: rec.string = family
        elif rec.nameID == 2: rec.string = style
        elif rec.nameID == 3: rec.string = ps + ';asd1m202'
        elif rec.nameID == 4: rec.string = full
        elif rec.nameID == 6: rec.string = ps
        elif rec.nameID in (16, 17): rec.string = family if rec.nameID == 16 else style


def register(file_name, display):
    key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, r'Software\Microsoft\Windows NT\CurrentVersion\Fonts')
    winreg.SetValueEx(key, display + ' (TrueType)', 0, winreg.REG_SZ, os.path.join(DEST, file_name))
    winreg.CloseKey(key)


for key, weight, family, style, out_name in WANTED:
    src = download(key)
    target = os.path.join(TMP, out_name)
    font = TTFont(src)
    if weight is not None and 'fvar' in font:
        axes = {'wght': weight}
        if any(a.axisTag == 'wdth' for a in font['fvar'].axes):
            axes['wdth'] = 100
        font = instancer.instantiateVariableFont(font, axes, inplace=False, updateFontNames=False)
        set_name(font, family, style)
        font['OS/2'].usWeightClass = weight
        if style == 'Bold':
            font['OS/2'].fsSelection &= ~(1 << 6)
            font['OS/2'].fsSelection |= (1 << 5)
            font['head'].macStyle |= 1
    font.save(target)
    shutil.copy(target, os.path.join(DEST, out_name))
    register(out_name, family if style == 'Regular' else family + ' ' + style)
    print('zainstalowano', family, style)
print('Gotowe. Fonty są w', DEST)
