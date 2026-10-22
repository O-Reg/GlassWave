# NCM fixtures

These are generated 0.2-second 440 Hz sine tones, not commercial recordings.
The fixtures and their metadata are provided under this repository's MIT license.
MP3 and FLAC audio were generated with FFmpeg using:

```
ffmpeg -f lavfi -i sine=frequency=440:sample_rate=44100:duration=0.2 -map_metadata -1 -c:a libmp3lame -b:a 128k tone.mp3
ffmpeg -f lavfi -i sine=frequency=440:sample_rate=44100:duration=0.2 -map_metadata -1 -c:a flac tone.flac
```

The NCM wrappers were generated independently of the production decoder, using
the public NCM format documented by [ncmdump](https://github.com/taurusxin/ncmdump/blob/master/src/ncmcrypt.cpp).
They use the synthetic key `fixture-key-for-generated-tone`, a 1x1 PNG cover,
37 bytes of reserved cover padding, Chinese metadata and deliberately incorrect
metadata format values. Tests compare the entire decoded bytes to the original
audio files rather than round-tripping through the production decoder.
