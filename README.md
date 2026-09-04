# World War Z Website v1.41.0

Updated-files release for the **Security / Reliability Hardening Pass**.

Apply these files over the confirmed Website v1.40.0 deployment. It pairs with Bot v1.33.0.

The shared browser HTTP layer now prevents authenticated bearer credentials from being sent anywhere except the trusted WWZ Railway API, enforces no-cookie/no-referrer/no-store requests, clamps request timeouts and blocks protected redirect following. Static pages also adopt a no-referrer policy and the dashboard CSP is tightened. The bounded PWA/map-cache generation remains preserved.
