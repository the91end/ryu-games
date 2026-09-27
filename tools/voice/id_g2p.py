"""Indonesian text -> IPA phonemes for Kokoro.

Indonesian spelling is almost phonetic. The one big ambiguity is "e", which can
be /e/ (bebek, merah) or /ə/ (kelapa, jeruk). Like Indonesian dictionaries, we
write é for /e/ and keep plain e for /ə/. RESPELL maps words to that spelling;
add new words there when the voice mispronounces them.
"""

import re

# é = /e/ (bébék), è = /ɛ/, plain e = /ə/ (kelapa)
RESPELL = {
    "apel": "apél", "be": "bé", "bebek": "bébék", "benda": "bénda", "boneka": "bonéka",
    "brem": "brém", "ce": "cé", "ceri": "céri", "de": "dé", "e": "é", "ef": "éf",
    "eks": "éks", "el": "él", "em": "ém", "en": "én", "er": "ér", "es": "és", "fe": "fé",
    "ge": "gé", "hebat": "hébat", "helikopter": "hélikoptér", "hewan": "héwan",
    "hiiieee": "hiiiéé", "hore": "horé", "jaket": "jakét", "je": "jé", "kakek": "kakék",
    "kretek": "kréték", "kereta": "keréta", "kue": "kué", "kwek": "kwék", "lemon": "lémon", "mbeek": "mbéék",
    "mbek": "mbék", "meong": "méong", "merah": "mérah", "monyet": "monyét", "nenek": "nénék",
    "oranye": "oranyé", "pe": "pé", "penguin": "pénguin", "pensil": "pénsil", "petok": "pétok",
    "roket": "rokét", "sendok": "séndok", "sepeda": "sepéda", "stroberi": "strobéri",
    "te": "té", "telepon": "télépon", "terong": "térong", "we": "wé", "wer": "wér",
    "wortel": "wortél", "ye": "yé", "zebra": "zébra", "zet": "zét", "ember": "émber",
    "ekor": "ékor", "enak": "énak", "meja": "méja", "sate": "saté", "tempe": "témpé",
}

ONES = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"]


def number_words(n):
    if n < 10:
        return ONES[n]
    if n == 10:
        return "sepuluh"
    if n == 11:
        return "sebelas"
    if n < 20:
        return f"{ONES[n - 10]} belas"
    if n < 100:
        tens, ones = divmod(n, 10)
        return f"{ONES[tens]} puluh" + (f" {ONES[ones]}" if ones else "")
    if n == 100:
        return "seratus"
    return str(n)


# Longest graphemes first
GRAPHEMES = [
    ("ng", "ŋ"), ("ny", "ɲ"), ("sy", "ʃ"), ("kh", "h"),
    ("c", "ʧ"), ("j", "ʤ"), ("y", "j"), ("g", "ɡ"), ("q", "k"), ("v", "f"), ("x", "ks"),
    ("é", "e"), ("è", "ɛ"), ("e", "ə"),
]
VOWELS = set("aiueoəɛ")


def word_to_ipa(word):
    w = RESPELL.get(word, word)
    out = []
    i = 0
    while i < len(w):
        for g, p in GRAPHEMES:
            if w.startswith(g, i):
                out.append(p)
                i += len(g)
                break
        else:
            out.append(w[i])
            i += 1
    # /e/ in a closed syllable is the open [ɛ] (bebek -> bebɛk, nenek -> nenɛk)
    for j, p in enumerate(out):
        nxt = out[j + 1:j + 3]
        if p == "e" and nxt and nxt[0] not in VOWELS and (len(nxt) == 1 or nxt[1] not in VOWELS):
            out[j] = "ɛ"
    # Final k after a vowel is a glottal stop (bebek -> bébéʔ)
    if len(out) > 2 and out[-1] == "k" and out[-2] in VOWELS:
        out[-1] = "ʔ"
    # Stress the second-to-last syllable (the last one if that has a schwa)
    nuclei = [j for j, p in enumerate(out) if p in VOWELS and not (j > 0 and out[j - 1] in VOWELS and p in "iu" and out[j - 1] in "ao")]
    if nuclei:
        k = nuclei[-2] if len(nuclei) > 1 else nuclei[-1]
        if out[k] == "ə" and len(nuclei) > 1:
            k = nuclei[-1]
        onset = k
        while onset > 0 and out[onset - 1] not in VOWELS:
            onset -= 1
        if onset > 0 and k - onset > 1:  # medial consonant cluster: only the last one starts the syllable
            onset = k - 1
        out.insert(onset, "ˈ")
    return "".join(out)


def to_ipa(text):
    text = re.sub(r"\d+", lambda m: number_words(int(m.group())), text.lower())
    parts = re.findall(r"[a-zéè]+|[!?.,]|-", text)
    ipa = []
    for p in parts:
        if p in "!?.,":
            ipa[-1:] = [(ipa[-1] if ipa else "") + p]
        elif p == "-":
            continue
        else:
            ipa.append(word_to_ipa(p))
    return " ".join(ipa)


if __name__ == "__main__":
    import sys
    for t in sys.argv[1:] or ["Bebek!", "Kelapa!", "Jeruk", "Mobil Pemadam", "Hore! Kamu pintar main lagu!", "12", "Kwek kwek!"]:
        print(t, "->", to_ipa(t))
