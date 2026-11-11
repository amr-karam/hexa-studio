# 7 GitHub Tools the NSA Uses (That Anyone Can Download) — Key Takeaways

[![Video thumbnail](https://i.ytimg.com/vi/i-V89uYnCZ4/maxresdefault.jpg)](https://www.youtube.com/watch?v=i-V89uYnCZ4)

**Source:** [7 GitHub Tools the NSA Uses (That Anyone Can Download)](https://www.youtube.com/watch?v=i-V89uYnCZ4) — Electronic Tech Show, ~15 min.

## Reverse-engineer binaries safely with Ghidra

- **Use Ghidra instead of paying for IDA Pro.** The speaker notes IDA Pro's expert plan lists at €4,999/year while the agency's Ghidra is free with 94,000+ GitHub stars. ([11:40](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=700s), [11:52](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=712s))
- **Install it on Kali with one `apt` command** — Kali packages Ghidra itself, with the code browser and decompiler included. ([12:21](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=741s))
- **Script `analyzeHeadless` for batch work.** Point it at a folder of samples and run overnight with no window; anything scripted in the GUI works headless, so one script scales to 1,000 files. ([12:35](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=755s)–[12:54](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=774s))
- **Only open files you wrote yourself or crackme practice files, and only inside a VM** — never an email attachment on your main computer. ([12:56](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=776s)–[13:04](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=784s))
- **Assume any secret baked into a binary is readable in seconds.** His demo: a name-scrubbed binary was decompiled in ~8 seconds and the string-compared password ("ETS 7731 NSA" per the captions) recovered — keep keys on the server. ([13:14](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=794s)–[14:06](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=846s))
- **Know the history of its debug mode:** Rob Joyce said on stage there was no backdoor; within hours Matthew Hickey showed Ghidra's debug mode opened port 18001 to the local network, letting anyone who could reach it run code. Debug mode is off by default and 9.0.1 closed the port. ([13:39](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=819s)–[13:57](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=837s))

## Hunt web shells with Yara — and a clean-copy compare

- **Get the NSA/Australian Signals Directorate "Mitigating Web Shells" repo**, which ships Yara rules (a core set and an extended set) for finding shells dropped on a server. ([4:20](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=260s), [4:31](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=271s), [4:37](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=277s))
- **Run both rule sets — don't trust one.** His test: a 3-line shell planted in an uploads folder as `avatar.php` was missed by the core set and flagged twice (obfuscated functionality, possible indicator) only by the extended set. ([4:48](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=288s)–[5:02](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=302s))
- **Vet core hits first and expect false positives from extended rules** — they flagged a harmless git sample hook script; the README says to vet core hits first and use the compiled rule files (some security software flags the uncompiled ones as malicious). ([5:29](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=329s), [5:45](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=345s)–[5:53](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=353s))
- **Keep a known-good copy of your site and diff it against live.** One diff printed only the file he planted. Store the clean copy where the server can't write to it and run the compare after every deploy. ([5:06](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=306s)–[5:15](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=315s), [6:12](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=372s))
- **Put scanning and comparing on a schedule and read every hit the morning after** — a scanner guesses from patterns; a compare tells you what actually changed. Read the file yourself before panicking. ([5:57](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=357s)–[6:11](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=371s))

## Check SELinux enforcement on every Linux box you run

- **Run `getenforce` on Linux servers you own; the answer you want is `enforcing`.** `permissive` means SELinux logs what it would have blocked but blocks nothing; `disabled` means no policy protects the machine at all — the speaker calls permissive/disabled "the first setting to fix." ([6:18](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=378s), [7:21](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=441s)–[7:44](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=464s))
- **On Kali, install the `selinux-utils` package first** — `getenforce` isn't shipped by default. ([7:11](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=431s)–[7:21](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=441s))
- **Know why it matters:** even root only gets exactly what its policy allows, so a hacked service can't step outside its lane. NSA released it under an open-source license in Dec 2000, it merged into the mainline kernel in Aug 2003, arrived on Android in 4.3, and has run every app in enforcing mode since Android 5. ([6:30](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=390s), [6:40](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=400s)–[6:54](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=414s))
- **Watch the failure mode:** SELinux only blocks what policy forbids, and when it gets in the way people often turn it off. ([6:59](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=419s)–[7:06](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=426s))

## Generate passwords, passphrases, and keys with Rand Pass Generator

- **Use the NSA's Rand Pass Generator for the one passphrase that guards your password manager**, and let the manager handle everything else. It draws from a hash-DRBG generator built to a NIST standard and refuses to run if its own self-tests fail. ([2:48](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=168s)–[3:05](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=185s), [4:15](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=255s))
- **Build it from source with Java + Ant** (one `apt` install, then `ant jar`), and run the jar from the folder you built it in — running from your home folder fails with "cannot access the jar." ([3:30](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=210s)–[3:55](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=235s))
- **Learn the flags: `-pw` passwords, `-pp` passphrases, `-k` keys, `-str` bits of strength.** His test: 96 bits produced three random 16-character passwords; 128 bits produced two 8-word passphrases. ([3:57](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=237s)–[3:21](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=201s))
- **Don't expect a password manager replacement** — it's a Java command-line tool with no app and no sync. ([3:23](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=203s)–[3:28](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=208s))
- **Context for skepticism:** this is the agency Reuters says paid RSA $10 million to make a suspect RNG the default (RSA denied any deal; NIST told everyone to stop using that generator in 2014) — but this tool uses a different, still-recommended generator from the same NIST family. ([2:32](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=152s)–[2:47](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=167s))

## Run Apache NiFi only with its defaults locked on

- **Never expose the NiFi canvas** — an exposed instance lets whoever reaches it build data flows on your machine. Recent versions start with login and an encrypted connection switched on; leave them that way. ([8:39](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=519s)–[8:48](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=528s), [9:34](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=574s))
- **Verify the download before unzipping:** Apache publishes a SHA-512 checksum next to the zip — check it first (the video's download was ~850 MB; exact version not repeated to avoid miscaptioning). ([8:52](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=532s)–[9:04](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=544s))
- **Start it with `nifi.sh` from the `bin` folder after exporting `JAVA_HOME`**, expect ~2.5 minutes to an HTTP 200 on its web interface, and stop it with the same script so nothing keeps running in the background. ([9:05](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=545s)–[9:32](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=572s))

## Don't build new crypto on Simon and Speck

- **For your own projects use AES or ChaCha20 from an audited library** — leave Simon and Speck to the tiny chips they were made for. ([11:31](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=691s))
- **Understand why they're controversial:** experts in Germany, Japan, and Israel fought them because they feared the NSA knew how to break them; a Linux kernel developer wrote a patch to remove them; ISO accepted them only for RFID tags. The NSA answered that 70+ security analysis papers back its conclusion, and the speaker stresses a passing test vector proves the cipher works as published but can't settle the trust question. ([9:40](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=580s)–[10:12](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=612s), [10:29](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=629s))
- **Read the spec yourself in under a minute:** clone the Simon/Speck Supercop repo, open the reference stream file in the spec 128 folder — the encrypt function is ~10 lines in a 32-round loop; the repo also includes Simon 2 and the Jambu authenticated-encryption scheme. ([10:35](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=635s)–[11:29](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=689s))

## Treat the Enigma Simulator as a history lesson, not a tool

- **Don't protect anything modern with anything like Enigma** — it's been broken for nearly a century. ([2:26](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=146s)–[2:31](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=151s))
- **Use the repo to learn the cryptanalysis that beat it:** feed its output back from the same rotor position to see the reciprocal property (and that a real Enigma never encrypts a letter as itself — the habit codebreakers used to discard wrong guesses by the thousand). The bundled notebook walks through breaking it the way Marian Rejewski did in the 1930s. ([1:35](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=95s)–[2:09](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=129s))
- **Try it on any Kali box:** git and Python 3 are already installed — one `git clone` and step into the folder. ([2:14](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=134s)–[2:25](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=145s))

## What the agency actually uses (and one thing to do this week)

- **Only two are confirmed in NSA use:** Ghidra's README says the agency applied it to analyzing malicious code, and NiFi ran inside the agency as "Niagara Files" for 8+ years before its Nov 2014 release (top-level Apache project in July 2015; 6,000+ stars) — the other five it simply built and handed out. ([7:44](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=464s)–[8:33](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=513s), [14:09](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=849s)–[14:23](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=863s))
- **The speaker's suggested starter tasks:** run `getenforce` on a Linux box you own, or keep a clean copy of your website and compare it with the live one. ([14:35](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=875s)–[14:42](https://www.youtube.com/watch?v=i-V89uYnCZ4&t=882s))
