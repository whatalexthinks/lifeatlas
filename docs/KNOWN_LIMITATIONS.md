# Known limitations

What this build does **not** do yet, in plain terms. Everything listed is either labelled as a demo in the interface or not offered at all.

## By design in the demo

- **One browser, no accounts.** Data lives in this browser's IndexedDB. Another device, browser or private window starts fresh. "Demo identities" (Sarah, Jonah, Emma…) switch what the interface shows; they are not sign-in and enforce nothing.
- **Permissions are simulated.** The rules are real and tested, but nothing is enforced on a server. Anyone with access to the browser can see everything stored in it.
- **Nothing is sent.** Invitations produce a link and a preview; no email or text goes out. Contact and support messages are kept on this device.
- **Nothing is charged.** Checkout is a demonstration with no card fields. Orders, invoices and receipts say $0.00 charged.
- **Nothing is made or shipped.** Proofs can be printed or saved as PDF in the browser; there is no print vendor or carrier. Shipping and tax are not calculated.
- **Nothing is backed up.** Downloads are the only copy outside the browser. Clearing site data erases the demo.
- **Letters are not scheduled.** They can be written, sealed (reversibly, with a fingerprint) and previewed. No delivery service exists.
- **No automatic transcription.** Transcripts are typed by people.
- **Prices are test prices** ($99/yr Digital, $179/yr Family within a $149–$249 range, $249 physical kit, $119 book) and are launch hypotheses.

## Partially built

- **Book builder:** memories, chapter order, cover, trim, layout style and page preview work. Choosing photos per story, reordering individual stories, per-page layouts and editing captions inside the builder are not built (captions are edited on the memory).
- **Keepsake box:** finish, engraving and contents work, and personalised boxes wait for a proof. Choosing which photos are printed is automatic (most recent printable photos). Gifting the physical kit, and a gift message on the kit, are not built.
- **Gifts:** the printable gift card listed as a free add-on has no printable view yet.
- **Shipping form:** free-text country and region; no address lookup, phone number, separate billing address or "ship to the recipient" option.
- **Plan changes:** upgrade by buying the other plan (the old one ends at its renewal); no downgrade flow or proration.
- **Promotions:** rules are configuration data; there is no editor for them. Per-customer limits are counted on this device only. The "every 10th activation" giveaway exists only as a draft that cannot be activated.
- **Video:** short clips (up to 10 minutes, 150 MB) are stored as recorded; no transcoding, thumbnails or streaming.
- **Proofs:** approve only; "request changes" isn't available.

## Browser support

- Recording uses `MediaRecorder`. Where it's unavailable or the microphone is refused, people can upload a recording or type instead.
- Storage limits vary by browser; the app warns when saving fails and offers a download.
