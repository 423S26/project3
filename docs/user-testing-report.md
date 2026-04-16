# Anchor User Testing Report

ESOF 423 Spring 2026  
Project 3  
Team Members: Ryan Barrett, Anthony Nania

## Overview
This document summarizes the user testing completed for Anchor, a sports psychology wellbeing platform for athletes and psychologists. Our goal during testing was to observe real user behavior with minimal intervention, document confusion and sticking points, and identify places where the interface or documentation could be improved before release.

The testing for this assignment was completed in three parts:

1. In-class peer review with four other ESOF 423 project groups
2. Independent user testing with non-CS users outside the course
3. Focused user testing with our client in a realistic use-case setting

## Application Under Test
Anchor is a web application that allows athletes to log psychological and physical wellbeing data and allows sports psychologists to review that data before sessions. Key features tested during this assignment included:

- account registration and login
- daily psychological check-ins
- dashboard calendar and filters
- physical state logging
- assessments and sessions pages
- settings and goals
- AI Coach screenshot import workflow
- psychologist athlete review workflow

## Part 1: In-Class Peer Review

### Test Setup
During the in-class peer review session, we met with four other project groups from ESOF 423. We demonstrated Anchor, observed how other students interpreted our interface, and also reviewed their applications. The peer groups we interacted with were other teams in the course organization, including groups represented by the public repositories in the class GitHub organization [423S26](https://github.com/423S26).

We asked peers to focus on these tasks:

1. Identify what the application appears to do from the landing page and dashboard
2. Navigate to the major app sections without explanation
3. Comment on whether the naming of features was clear
4. Review the psychologist and athlete workflows from a usability perspective

### What We Observed
- Most peers understood the overall purpose of the application quickly once they saw the landing page and dashboard together.
- Peers consistently described the dashboard as the strongest part of the interface because it immediately showed that the app combines multiple types of athlete data in one place.
- A few peers were unsure about the difference between `Psychological State` and `Assessments`. They assumed both pages were forms for the same type of mood entry.
- The AI Coach feature stood out to peers as the most interesting feature, but some were unsure what would happen after pressing the action button to apply extracted data.
- One peer noted that the dark mode styling was generally clean, but a few cards had borders that blended into the page background.

### Notes From Reviewing Other Groups' Apps
Seeing other teams' apps reminded us that first-use clarity matters more than feature count. A few other groups had simpler interfaces that were easier to explain immediately, which pushed us to think more critically about our naming and onboarding. Comparing projects also reinforced that users often judge confidence and quality from the landing page and first dashboard load before they understand any deeper functionality.

### What We Learned From Peer Review
- Peer reviewers are useful for identifying naming problems because they are technical enough to explore fast, but unfamiliar enough to still notice unclear labels.
- Our app appeared feature-complete, but not every feature name was self-explanatory.
- The landing page and dashboard communicate value well, but page labels need to reduce ambiguity.

## Part 2: Independent User Test

### Test Setup
For the independent user test, we asked non-CS users to try Anchor with only a short verbal overview of what the app does. We avoided guiding them through the interface unless they were completely stuck. We specifically wanted to observe how well the interface and documentation supported independent use.

We had independent users attempt the following:

1. Register as an athlete
2. Log a daily check-in
3. Verify the check-in on the dashboard
4. Navigate to Physical State and log information there
5. Open Help documentation if they got confused
6. Try the AI Coach feature with a screenshot if time allowed

### What Happened
- Users were generally able to register and log in without major problems.
- The daily check-in flow was one of the easiest tasks for independent users. Most users understood the form quickly and could submit it without help.
- Several users hesitated when interpreting the 1-10 mood scale. Even with emoji support, one user initially assumed low numbers meant better outcomes.
- Users expected stronger visual confirmation after submitting a check-in. Some did not immediately realize the dashboard reflected their new data.
- One user had trouble understanding the difference between logging a normal check-in and completing an assessment.
- The Help page was useful as a fallback, but users preferred figuring things out directly in the UI instead of reading documentation first.
- The AI Coach concept was easy to understand when explained, but the apply/import step needed clearer wording so users felt confident about what data would be saved.

### Questions Users Asked
- "What is the difference between Psychological State and Assessments?"
- "Did my check-in save already?"
- "Who can see this information after I submit it?"
- "What happens if I press apply on the AI result?"

### Surprises
The biggest surprise was that independent users did not struggle with the overall complexity of the app as much as we expected. Instead, the most common friction came from terminology and confirmation states. This showed us that the platform's structure is usable, but that copy and feedback messaging matter a lot.

### What We Learned From Independent Testing
- Independent users are the best source for finding terminology problems.
- The interface is usable without hand-holding, but some actions need more visible confirmation.
- Documentation is helpful, but users expect the UI itself to explain the next step.

## Part 3: Focused Client User Test

### Test Setup
For the focused user test, both partners planned to observe our client using the software in a realistic sports psychology workflow. The goal was to give minimal input and watch what the client actually did rather than just what he said.

We centered the session around these tasks:

1. Log in as a psychologist
2. Review athlete information from the dashboard
3. Navigate between athlete-facing and psychologist-facing information
4. Examine assessment and context information
5. Evaluate whether the app supports normal session preparation

### What We Observed
- The client understood the overall purpose of the app quickly and used the dashboard as the main point of orientation.
- The psychologist view supported the client's main workflow well: reviewing multiple dimensions of athlete wellbeing before a session.
- The client responded positively to seeing multiple data types in one location rather than having to look through separate tools.
- The client saw clear value in the AI-assisted import workflow because it reduces repetitive manual entry from plans and screenshots.
- The client wanted even more review context around athlete data, especially when looking at assessments and trends.
- The client behavior suggested that the app is closest to real value when it helps session preparation and not just data storage.

### Questions the Client Asked
- "Can I see more context about what happened on the same day as an assessment?"
- "How quickly can I tell which athlete needs attention most?"
- "Can this replace some of the manual tracking I already do before sessions?"

### What We Learned From Client Testing
- The core concept is useful in a real workflow, not just as a class project demo.
- The biggest value for the client is combining data sources into one review screen.
- The client's questions were less about navigation and more about depth of context, which is a good sign for release readiness.

## Patterns Across All Testing

### Most Common Sticking Points
- unclear distinction between `Psychological State` and `Assessments`
- weak confirmation that saved actions completed successfully
- uncertainty about what the AI import action would do

### Most Common Strengths
- dashboard communicates value quickly
- check-in workflow is fast and intuitive
- role-based structure makes sense once inside the app
- AI screenshot import feels unique and high-value

### Documentation Gaps Identified
- clearer explanation of who can see submitted data
- stronger explanation of the difference between a daily check-in and a formal assessment
- more explicit guidance about what the AI Coach imports and when data is saved

## Resulting Changes and Planned Changes

### Changes Already Made
- removed unnecessary notifications section from settings
- replaced dashboard placeholders with live data
- improved dark mode border contrast in some areas
- expanded release report and README documentation

### Changes We Intend To Make
- improve wording around AI import/apply actions
- make the distinction between check-ins and assessments more obvious
- strengthen save/submit confirmation messaging
- continue polishing psychologist review context and trend visibility

## Final Reflection
This testing process showed that Anchor is usable without heavy guidance and is close to release-candidate quality. The issues users encountered were mostly related to naming, clarity, and feedback rather than broken workflows. That is an encouraging result because it means the application structure is strong, while the remaining improvements are primarily usability polish.

The peer review helped us understand how our app compares to other teams in terms of first-use clarity. The independent user test revealed where normal users hesitate or reinterpret labels. The focused client session confirmed that the app supports a real-world workflow and provides value beyond a class prototype.

Overall, user testing gave us more confidence in the product while also identifying the specific friction points we should address next.
