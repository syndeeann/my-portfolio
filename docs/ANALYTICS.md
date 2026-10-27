# Analytics: Google Tag Manager + GA4 + Looker Studio

**How it's wired:** both pages load `assets/analytics.js`, which loads Google Tag Manager container **GTM-K8G85R8D** and pushes every event to the data layer. Tag Manager turns each one into a GA4 event for property stream **G-X3XPDCS4SZ**.

In Tag Manager (the same idea as rules and data elements in Adobe Launch):

| Folder | What's in it |
|---|---|
| 01 · GA4 tags | `GA4 - Google tag (page views)` fires on every page; one `GA4 - Event - <event>` tag per event |
| 02 · Triggers (custom events) | `CE - <event>`: a Custom Event trigger matching the data layer `event` name |
| 03 · Variables (data layer) | `DLV - <parameter>`: one Data Layer Variable per event parameter, plus `CONST - GA4 Measurement ID` |

To add a new event: push it with `track('event_name', {...})` from the page, then in Tag Manager add a `CE - event_name` trigger, the `DLV - ...` variables it needs, and a `GA4 - Event - event_name` tag, and publish.

## 1. Check it's working

- **Tag Manager Preview:** in Tag Manager, click **Preview**, enter `https://syndeeann.github.io/my-portfolio/`, and click around. Each data layer event and the tag it fired are listed.
- **GA4:** **Reports → Realtime**, or **Admin → DebugView** while Preview is running.
- **Browser console:** add `?ga_debug=1` to any page address to log every data layer push.

## 2. Enhanced measurement settings

Open **Admin → Data streams → (your stream) → Enhanced measurement** (the gear icon). The site sends its own cleaner versions of several automatic events, so turn these **off** to avoid double counting:

| Setting | Set to | Why |
|---|---|---|
| Page views | **On** | Visits and page loads come from here |
| Scrolls | Off | The site sends `scroll_depth` at 25/50/75/90/100% |
| Outbound clicks | Off | Every click is in `ui_click` |
| File downloads | Off | CV opens are in `cv_open` |
| Video engagement | **Off** | Otherwise the muted 5-second trailers would count as video starts |
| Site search, Form interactions | Off | Not used |

## 3. Register custom dimensions

GA4 only shows custom event parameters in reports and Looker Studio after you register them. Go to **Admin → Custom definitions → Create custom dimension**, choose scope **Event**, and add each row below. Dimensions fill in from the day they're registered, and can take 24–48 hours to appear.

| Dimension name | Event parameter |
|---|---|
| Page type | `page_type` |
| Workflow | `workflow_name` |
| Site version | `site_version` |
| Section | `section_name` |
| Click group | `link_group` |
| Click type | `link_type` |
| Click platform | `link_platform` |
| Interaction type | `interaction_type` |
| Interaction label | `interaction_label` |
| Video ID | `video_id` |
| Video number | `video_number` |
| Video source | `video_source` |
| Video destination | `video_destination` |
| Contact method | `contact_method` |
| Scroll percent | `percent_scrolled` |

These are already built into GA4, so you don't register them: **Link text** (`link_text`), **Link URL** (`link_url`), **Video title**, **Video URL**, **Video provider** and **Video percent**. If GA4 says a parameter is already in use, skip it.

## 4. Key events

Under **Admin → Events**, mark these as key events (conversions):

- `contact_intent`: someone copied your email, opened their mail app, or clicked LinkedIn
- `cv_open`: someone opened your CV
- `workflow_open`: someone entered a workflow studio page
- `video_start`: someone started a full video in the on-page player

## 5. Event reference

Every event also carries `page_type` (`portfolio` or `workflow`), `workflow_name` (`(none)` on the main page, `kwento_kilabot` on the studio page) and `site_version`.

| Event | When it fires | Parameters |
|---|---|---|
| `page_view` | Every page load (automatic) | page title, page location |
| `section_view` | First time a section is 35% on screen | `section_name`: hero, focus, ai_studio, credentials, background, contact, workflow_diagram, videos, channels |
| `scroll_depth` | First time the page is scrolled 25/50/75/90/100% | `percent_scrolled` |
| `ui_click` | Every link and button click | `link_text`, `link_url`, `link_type` (internal, outbound, anchor, email, document, button, placeholder), `link_group` (nav, hero, ai_studio, contact, videos, video_player, footer…), `link_platform` (youtube, facebook, linkedin, github, email, site…) |
| `ui_interaction` | Interactions that aren't plain clicks | `interaction_type` and `interaction_label`, listed below |
| `video_trailer_view` | A story's 5-second trailer starts playing on its card (once per story per visit) | `video_title`, `video_id`, `video_number`, `video_url`, `video_provider`, `video_source` = trailer |
| `video_click` | A play button or platform link on a story is clicked | the video fields + `video_destination` (on_page_player, youtube, facebook…), `link_group` |
| `video_start` | A full video starts in the on-page player | the video fields + `video_source` = on_page_player |
| `video_progress` | The full video reaches 10/25/50/75/90% | the video fields + `video_percent`, `video_current_time`, `video_duration` |
| `video_complete` | The full video reaches the end | the video fields + `video_percent` = 100 |
| `contact_intent` | Copy email, mail app, or LinkedIn | `contact_method` (copy_email, email_app, linkedin), `link_group` |
| `cv_open` | CV link clicked | `link_group` |
| `workflow_open` | A workflow card or link opens a studio page | `workflow_name`, `link_group` |

`ui_interaction` types:

| `interaction_type` | `interaction_label` | Page |
|---|---|---|
| `claude_demo_step` | the demo prompt chosen in the hero chat | Main |
| `workflow_card_hover` | `kwento_kilabot` (hovered for 0.8 s or more) | Main |
| `workflow_interest` | the coming-soon workflow clicked (e.g. Advertisement videos) | Main |
| `flashlight` | `hero` (visitor moved the flashlight) | Studio |
| `workflow_run` | `auto` (scrolled into view) or `button` | Studio |
| `workflow_step_view` | the diagram step opened (e.g. `qc`, `generate`) | Studio |
| `video_close` | `Kilabot #N`, with `video_percent` = how far they watched | Studio |

## 6. Looker Studio report

1. Go to [Looker Studio](https://lookerstudio.google.com) → **Create → Report → Google Analytics**, and pick your portfolio property.
2. Build these pages. Most charts filter on **Event name**, so create a few reusable filters first (for example "Event name = ui_click").

**Page 1: Overview**
- Scorecards: Active users, Sessions, Views, Average engagement time, Key events
- Time series: Active users and Views by Date
- Table: Page title, Views, Average engagement time
- Table: Session source / medium, Active users, Key events (where visitors come from)
- Geo map: Active users by Country

**Page 2: Engagement**
- Bar chart: Section by Event count, filter `section_view` (how far into the page people get)
- Bar chart: Scroll percent by Event count, filter `scroll_depth` (scroll funnel)
- Table: Click group, Link text, Click platform, Event count, filter `ui_click` (what people click)
- Donut chart: Click platform by Event count, filter `ui_click` and Click type = outbound

**Page 3: Videos**
- Pivot table: rows Video title, columns Event name, metric Event count, filter Event name in (`video_trailer_view`, `video_click`, `video_start`, `video_complete`). This shows each story's trailer → click → watch → finish funnel.
- Bar chart: Video percent by Event count, filter `video_progress`, broken down by Video title (where viewers drop off)
- Table: Video title, Video destination, Event count, filter `video_click` (on the page vs. on YouTube or Facebook)

**Page 4: AI Studio**
- Scorecard: Event count, filter `workflow_open`
- Bar chart: Interaction label by Event count, filter Interaction type = `workflow_interest` (demand for upcoming workflows)
- Bar chart: Interaction label by Event count, filter Interaction type = `workflow_step_view` (which steps people explore)
- Table: Interaction type, Interaction label, Event count, filter Page type = workflow

**Page 5: Contact**
- Bar chart: Contact method by Event count, filter `contact_intent`
- Scorecard: Event count, filter `cv_open`
- Table: Session source / medium, Key events

Add a **date range control** and a **Page type** or **Workflow** drop-down filter to the top of each page so the report can be cut by page or workflow.

## 7. Privacy

The footer of each page says the site uses Google Analytics. GA4 doesn't log or store IP addresses. The site doesn't include a cookie consent banner; add one if you want visitors to opt in first.

## Adding a new workflow page

1. Create `studio/<workflow-name>.html`.
2. In its `<head>`, add:
   ```html
   <meta name="analytics-page-type" content="workflow">
   <meta name="analytics-workflow" content="<workflow_name>">
   <script src="../assets/analytics.js"></script>
   ```
3. Give each section an `id`, and add any new ids to `SECTIONS` in `assets/analytics.js` so they report a readable `section_name`.
4. Link to it from a card on the main page. Clicks on `studio/...` links fire `workflow_open` automatically.
