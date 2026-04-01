# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - img [ref=e16]
      - generic [ref=e19]: Sign in to Anchor
      - generic [ref=e20]: Sports psychology wellbeing tracking platform
    - generic [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]:
          - text: Email
          - textbox "Email" [ref=e24]:
            - /placeholder: you@example.com
            - text: rybarrett11@gmail.com
        - generic [ref=e25]:
          - text: Password
          - textbox "Password" [ref=e26]:
            - /placeholder: Enter your password
            - text: password
        - generic [ref=e27]:
          - checkbox "Remember me" [ref=e28]
          - generic [ref=e29]: Remember me
        - button "Sign In" [ref=e30] [cursor=pointer]
      - generic [ref=e31]:
        - text: Don't have an account?
        - link "Register" [ref=e32] [cursor=pointer]:
          - /url: /register
      - link "Having trouble? Submit feedback" [ref=e34] [cursor=pointer]:
        - /url: /feedback?from=/login
      - link "← Back to home" [ref=e36] [cursor=pointer]:
        - /url: /landing
```