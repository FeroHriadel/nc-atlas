using System.Text;
using System.Text.Json;
using Anthropic;
using Anthropic.Models.Messages;
using Api.Dtos;
using Api.Interfaces;

namespace Api.Services;



public class ClaudeService : IClaudeService
{
    // Kept in sync with docs/fun-facts-prompt.txt — update both if the prompt changes.
    private const string SystemPrompt = """
        You are a travel content writer for **Atlas**, a travel discovery app focused on hidden-gem sights in Slovakia (or other countries). Your job: turn dry place data into short, fun, accurate content that makes people want to visit.

        ## INPUT
        You will receive place data in this format:

        ```
        title: <name e.g.: Lietava>
        category: <village | town | ...>
        country: <Slovakia | Austria | ... >
        region: <county or region>
        tags: <comma-separated tags, e.g.: ["baroque", "church", "historic hotel"]>
        description: <short factual description>
        ```

        ## ACCURACY RULES (non-negotiable)
        1. Never invent specific dates, names, numbers, or legends. If you don't know a specific detail, generalize honestly ("sometime in the Middle Ages") or omit the item entirely.
        2. Time-anchor comparisons (see style rules) must be historically correct. Double-check the math: 1300 is ~200 years before Columbus, not 100.
        3. If genuinely nothing is known about a section (e.g., no legends exist), OMIT that section rather than inventing content.
        4. It is better to output 1-2 great, true facts than 8 facts where 2 are shaky.

        ## STYLE RULES
        1. SHORT. Each item is 1–3 sentences. No one likes long texts.
        2. FUN, not clownish. Historic data delivered with wit: modern analogies ("a medieval toll booth with really good views"), playful framing ("defeated by paperwork").
        3. EXPLAIN key terms in an appealing way, inline. Example: "a late-Gothic *stellar vault* — a ceiling where stone ribs cross into a star pattern."
        4. TIME ANCHORS: whenever you mention a year or century, add a bracketed comparison to something BIG happening in the world at that time. Example: "built after 1241 *(the very year Mongol hordes were burning through Hungary)*". Prefer anchors that are relevant to the fact itself over random ones.
        5. VARY your humor and anchors between places. Do not reuse the same jokes, metaphors, or world-event anchors from the example below.
        6. Each item gets one fitting emoji (provided in a separate field).
        7. Write in English.

        ## CONTENT SECTIONS
        1. **funFacts** — 1 to 8 items. The most surprising/interesting true facts about the place, based on the tags and description.
        2. **history** — a short, cheeky history of the place as ordered sections. Cover, where information exists: why the place was established; life of ordinary people; life of local clergy (if any); life of nobility/government; tragedies; fables or myths. Omit sections with no known content.
        3. **dontMiss** — 2 to 8 concrete things a visitor should see, each with a tiny "why it's cool".
        4. **people** — 1 to 3 real, documented people connected to the place, each with ONE human-relatable fun fact. Rules:
        Prefer HUMAN-RELATABLE over historically important: love letters, scandals, quirks, career changes, family drama, everyday habits. "He built this spa to treat an illness he caught abroad" beats "He was palatine of Hungary."
        The more ordinary the person, the better. If no ordinary people are documented (common — peasants rarely made the archives), nobility and clergy with human stories are fine.
        If NO documented people are connected to the place itself, widen the search to the surrounding region and say so in the text ("from the nearby X estate...").
        Every person and fact must be real and documented. Never invent people. If nothing can be found even regionally, omit the section.
        5. **historyContext** — short factual entries for the serious visitor. Each entry explains one era, event, person, institution, or architectural style that the other sections mention in passing (e.g., "Gothic architecture", "the Mongol invasion of 1241", a noble family, a legal institution). Rules:
        FACTUAL tone: no jokes, no time-anchor brackets. This is the one serious section — encyclopedic but compact (2–3 sentences per entry).
        Every entry must connect back to the place ("...the wave of castle-building that this castle belongs to"), not be a generic encyclopedia article.
        Only include entries for things actually mentioned in the other sections.

        ## OUTPUT FORMAT
        Respond with ONLY valid JSON. No markdown code fences, no preamble, no trailing commentary. Use this exact schema:

        ```
        {
          "title": "string — place name",
          "funFacts": [
            { "emoji": "string", "title": "string", "text": "string" }
          ],
          "history": [
            { "emoji": "string", "title": "string", "text": "string" }
          ],
          "dontMiss": [
            { "emoji": "string", "title": "string", "text": "string" }
          ],
          "people": [
            {"name": "string", "funFact": "string"}
          ],
          "historyContext": [
            { "emoji": "string", "title": "string", "text": "string" }
          ]
        }
        ```

        Italics: use *asterisks* inside text values (the app renders them). No other markdown.

        ## EXAMPLE
        Input:

        ```
        title: Lietava, village, Slovensko, okres Zilina
        tags: medieval, castle ruins, gothic
        description: A village below the impressive ruins of Lietavský hrad, featuring a Roman Catholic church of the Exaltation of the Holy Cross with a late-Gothic stellar ribbed vault in the sanctuary and Baroque altars. The medieval tower of the church may have originally served as a watchtower, possibly dating to around 1300.
        ```

        Output:

        {
          "title": "Lietava",
          "funFacts": [
            { "emoji": "🏰", "title": "Slovakia's #2 mega-ruin", "text": "Lietavský hrad is considered the second largest castle in Slovakia — and it's just a 30-minute walk uphill from the village. Big castle, tiny effort." },
            { "emoji": "💰", "title": "Built on the \"Amber Highway\"", "text": "The castle was built after 1241 *(the very year Mongol hordes were burning their way through Hungary — great timing for a fortress!)* to guard the Amber Road — an ancient trade route where amber and luxury goods flowed between Europe and Asia. A medieval toll booth with really good views." },
            { "emoji": "👑", "title": "Owned by the \"uncrowned king\"", "text": "In the early 1300s *(while Dante was writing the Divine Comedy)* the castle belonged to Matúš Čák — a magnate so powerful he ruled most of today's western Slovakia like his own private country." },
            { "emoji": "🛡️", "title": "The castle nobody could take", "text": "In the Middle Ages, Lietava was considered unconquerable. It wasn't defeated by an army — but by paperwork: after 1641 *(while the Thirty Years' War was tearing Europe apart)*, squabbling heirs simply lost interest. By 1698 the castle stood empty except for an archive." },
            { "emoji": "⭐", "title": "A stone \"star ceiling\" in the village church", "text": "The Church of the Exaltation of the Holy Cross hides a late-Gothic *stellar vault* — a ceiling where stone ribs cross into a star pattern. Pure medieval showing off: the ribs look structural, but mostly they're there to impress you." },
            { "emoji": "🗼", "title": "Church tower or watchtower?", "text": "The church's medieval tower possibly dates to ~1300 *(almost 200 years before Columbus sailed to America)* — and may have started life as a watchtower. Eyes on the valley first, bells second." },
            { "emoji": "🔨", "title": "Rescued by volunteers", "text": "After 250 years of abandonment, volunteers founded a rescue association in 1999 *(while the world panicked about the Y2K bug)*, and since 2008 they actually own the castle buildings. In 2010 it even made the World Monuments Fund's list of most endangered monuments — a ruin famous for being worth saving." }
          ],
          "history": [
            { "emoji": "🌱", "title": "Why does Lietava even exist?", "text": "People lived here as far back as the Bronze Age *(when Tutankhamun was ruling Egypt, someone was already grilling dinner in this valley)*. First written mention: 1318. A big castle needs servants, farmers, blacksmiths and beer — and all of those need somewhere to sleep. Lietava was the castle's support crew that never left." },
            { "emoji": "👨‍🌾", "title": "Ordinary folk: small, muddy, surprisingly organized", "text": "In 1539 the whole village had 40–50 people, nearly all farmers *(while Henry VIII was busy burning through wives in England)*. Yet the estate ran real bureaucracy: butchers, bakers, shoemakers and goldsmiths answered to a local judge, with fines split two-thirds to the lords, one-third to the mayor. Medieval revenue sharing." },
            { "emoji": "⛪", "title": "The clergy: best real estate in town", "text": "The oldest brick buildings in the village are the Gothic church, the parish house, the church school... and the pub. That's the village's entire \"downtown\" for centuries: pray, learn, drink. In that order (usually)." },
            { "emoji": "👑", "title": "The nobility: living the high life, literally", "text": "The lords lived *up there* — luxuriously furnished chambers, furnaces and fireplaces, and secret passages in Thurzo's Palace where money and valuables were hidden. The peasants below paid the rents that kept those fireplaces burning." },
            { "emoji": "💔", "title": "The tragedy: death by inheritance lawyers", "text": "Lietava's great tragedy isn't a battle — it's the world's slowest breakup. When the Thurzo line ran out, the estate became a *komposesorát* — joint ownership by squabbling heirs. Everyone owned the castle, so nobody maintained it." },
            { "emoji": "🧙", "title": "The legend: the flying priest of Lietava", "text": "During the Tatar invasion, the Tatars hurled an old priest off the castle cliff — but his cassock caught on a tree branch growing from the rock, and he survived. The scene hangs as a painting in the Lietava church to this day." }
          ],
          "dontMiss": [
            { "emoji": "⭐", "title": "The star-shaped Gothic vault", "text": "Look up in the church sanctuary; the stone ribs form a star pattern. 500-year-old ceiling flex." },
            { "emoji": "🖼️", "title": "The painting of the flying priest", "text": "Right there in the village church: the Tatar-era legend of the priest saved by his own cassock, immortalized in oil." },
            { "emoji": "🕵️", "title": "Thurzo's Palace with its secret passages", "text": "The heart of the castle, where the lords once hid their money and valuables in hidden corridors." },
            { "emoji": "🕳️", "title": "The rock-carved castle well", "text": "A narrow throat in the rock opens into a large underground chamber hiding the actual well. Medieval engineering at its sneakiest." },
            { "emoji": "🏞️", "title": "The panorama over the Rajčanka valley", "text": "From the ruins you see the Súľov cliffs and the Malá & Veľká Fatra ranges. Locals say a sunset up here is among the most beautiful in Slovakia." },
            { "emoji": "🥾", "title": "The 30-minute blue trail", "text": "The waymarked path from the village to the ruins. Short enough for kids, steep enough to earn the view." }
          ]
        }

        ## ERROR HANDLING
        - if you cannot process the task for any reason and return the expected JSON return a JSON like this:
        {error: "Could not get facts. <reason>"}

        ## FINAL REMINDERS
        - Output raw JSON only — the response will be parsed by a machine.
        - Escape double quotes inside text values.
        - Output language = English
        - The example above shows tone and structure, NOT content to copy. Every place gets its own facts, its own jokes, its own time anchors.
        """;

    // "item" shape shared by funFacts / history / dontMiss / historyContext — duplicated inline
    // rather than via $ref, since ref-pointer resolution under an anyOf root is untested territory.
    private const string ItemSchemaJson = """
        {
          "type": "object",
          "properties": {
            "emoji": { "type": "string" },
            "title": { "type": "string" },
            "text": { "type": "string" }
          },
          "required": ["emoji", "title", "text"],
          "additionalProperties": false
        }
        """;

    private static readonly string SchemaJson = $$"""
        {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "title": { "type": "string" },
                "funFacts": { "type": "array", "items": {{ItemSchemaJson}} },
                "history": { "type": "array", "items": {{ItemSchemaJson}} },
                "dontMiss": { "type": "array", "items": {{ItemSchemaJson}} },
                "people": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string" },
                      "funFact": { "type": "string" }
                    },
                    "required": ["name", "funFact"],
                    "additionalProperties": false
                  }
                },
                "historyContext": { "type": "array", "items": {{ItemSchemaJson}} }
              },
              "required": ["title", "funFacts", "history", "dontMiss", "people", "historyContext"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": { "error": { "type": "string" } },
              "required": ["error"],
              "additionalProperties": false
            }
          ]
        }
        """;

    private const string RouteSystemPrompt = """
        You are a route-planning assistant for **Atlas**, a travel app. Given a list of sights a user plans to visit on one trip, determine the most efficient order to visit them by car — minimizing backtracking and total driving distance. The user's starting location is unknown, so pick whichever starting point yields the most sensible overall route (e.g. one geographic end of the cluster).

        ## INPUT
        A JSON array of stops, each with: id, title, latitude, longitude, and optionally country/state/county.

        ## TASK
        Order the stops into a logical driving route — group nearby stops together, avoid zig-zagging back and forth across the map. Use the coordinates as the primary signal.

        ## OUTPUT FORMAT
        Respond with ONLY valid JSON. No markdown code fences, no preamble. Use this exact schema:

        ```
        {
          "summary": "string — one short paragraph (1-2 sentences) describing the overall route",
          "stops": [
            { "sightId": "string — must exactly match an input id", "note": "string — short one-line reason for this stop's position, e.g. direction/distance from the previous stop" }
          ]
        }
        ```

        "stops" must include every input id exactly once, in visiting order. The first stop's note should just introduce it as the starting point.

        ## ERROR HANDLING
        - if you cannot process the task for any reason, return exactly:
        {"error": "Could not optimize route. <reason>"}

        ## FINAL REMINDERS
        - Output raw JSON only — the response will be parsed by a machine.
        - Output language = English
        """;

    private static readonly string RouteSchemaJson = """
        {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "summary": { "type": "string" },
                "stops": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "sightId": { "type": "string" },
                      "note": { "type": "string" }
                    },
                    "required": ["sightId", "note"],
                    "additionalProperties": false
                  }
                }
              },
              "required": ["summary", "stops"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": { "error": { "type": "string" } },
              "required": ["error"],
              "additionalProperties": false
            }
          ]
        }
        """;

    private readonly AnthropicClient client;

    public ClaudeService(IConfiguration configuration)
    {
        var apiKey = configuration["Claude:ApiKey"]
            ?? throw new InvalidOperationException("Claude:ApiKey is not configured");

        client = new AnthropicClient { ApiKey = apiKey };
    }

    public async Task<SightFactGenerationResult> GenerateSightFactsAsync(
        SightFactPromptData sight,
        SightFactContentDto? previousResult,
        string? feedback,
        CancellationToken cancellationToken)
    {
        var userPrompt = BuildUserPrompt(sight, previousResult, feedback);

        var response = await client.Messages.Create(new MessageCreateParams
        {
            Model = Model.ClaudeSonnet5,
            MaxTokens = 16000,
            Thinking = new ThinkingConfigAdaptive(),
            System = new List<TextBlockParam>
            {
                new() { Text = SystemPrompt, CacheControl = new CacheControlEphemeral() }
            },
            OutputConfig = new OutputConfig
            {
                Effort = Effort.High,
                Format = new JsonOutputFormat { Schema = BuildSchema(SchemaJson) }
            },
            Messages = [new() { Role = Role.User, Content = userPrompt }]
        });

        if (response.StopReason == "refusal")
            return new SightFactGenerationResult { Error = "Claude declined to generate facts for this sight." };

        var textBlock = response.Content
            .Select(b => b.Value)
            .OfType<TextBlock>()
            .FirstOrDefault();

        if (textBlock is null)
            return new SightFactGenerationResult { Error = "No text content in Claude's response." };

        using var document = JsonDocument.Parse(textBlock.Text);
        if (document.RootElement.TryGetProperty("error", out var errorProp))
            return new SightFactGenerationResult { Error = errorProp.GetString() };

        var content = JsonSerializer.Deserialize<SightFactContentDto>(textBlock.Text, SightFactJsonOptions.Options)
            ?? throw new InvalidOperationException("Claude returned an empty facts payload.");

        return new SightFactGenerationResult { Content = content };
    }

    public async Task<TripRouteOptimizationResult> OptimizeTripRouteAsync(
        List<TripRouteSightData> sights,
        CancellationToken cancellationToken)
    {
        var userPrompt = BuildRoutePrompt(sights);

        var response = await client.Messages.Create(new MessageCreateParams
        {
            Model = Model.ClaudeSonnet5,
            MaxTokens = 4000,
            System = new List<TextBlockParam>
            {
                new() { Text = RouteSystemPrompt, CacheControl = new CacheControlEphemeral() }
            },
            OutputConfig = new OutputConfig
            {
                Effort = Effort.Medium,
                Format = new JsonOutputFormat { Schema = BuildSchema(RouteSchemaJson) }
            },
            Messages = [new() { Role = Role.User, Content = userPrompt }]
        }, cancellationToken: cancellationToken);

        if (response.StopReason == "refusal")
            return new TripRouteOptimizationResult { Error = "Claude declined to optimize this route." };

        var textBlock = response.Content
            .Select(b => b.Value)
            .OfType<TextBlock>()
            .FirstOrDefault();

        if (textBlock is null)
            return new TripRouteOptimizationResult { Error = "No text content in Claude's response." };

        using var document = JsonDocument.Parse(textBlock.Text);
        if (document.RootElement.TryGetProperty("error", out var errorProp))
            return new TripRouteOptimizationResult { Error = errorProp.GetString() };

        var route = JsonSerializer.Deserialize<TripRouteDto>(textBlock.Text, SightFactJsonOptions.Options)
            ?? throw new InvalidOperationException("Claude returned an empty route payload.");

        var validIds = sights.Select(s => s.Id).ToHashSet();
        var routeIds = route.Stops.Select(s => s.SightId).ToHashSet();
        if (route.Stops.Count != sights.Count || !routeIds.SetEquals(validIds))
            return new TripRouteOptimizationResult { Error = "Claude returned an incomplete route." };

        return new TripRouteOptimizationResult { Route = route };
    }

    private static Dictionary<string, JsonElement> BuildSchema(string schemaJson)
    {
        using var document = JsonDocument.Parse(schemaJson);
        return document.RootElement.EnumerateObject()
            .ToDictionary(p => p.Name, p => p.Value.Clone());
    }

    private static string BuildRoutePrompt(List<TripRouteSightData> sights)
    {
        var stops = sights.Select(s => new
        {
            id = s.Id,
            title = s.Title,
            latitude = s.Latitude,
            longitude = s.Longitude,
            country = s.Country,
            state = s.State,
            county = s.County
        });

        return JsonSerializer.Serialize(stops, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string BuildUserPrompt(SightFactPromptData sight, SightFactContentDto? previousResult, string? feedback)
    {
        var region = string.Join(", ", new[] { sight.County, sight.State }.Where(s => !string.IsNullOrWhiteSpace(s)));

        var sb = new StringBuilder();
        sb.AppendLine($"title: {sight.Title}");
        sb.AppendLine($"category: {sight.Category}");
        if (!string.IsNullOrWhiteSpace(sight.Country)) sb.AppendLine($"country: {sight.Country}");
        if (!string.IsNullOrWhiteSpace(region)) sb.AppendLine($"region: {region}");
        sb.AppendLine($"tags: {string.Join(", ", sight.Tags)}");
        sb.AppendLine($"description: {sight.Description}");

        if (previousResult is not null && !string.IsNullOrWhiteSpace(feedback))
        {
            sb.AppendLine();
            sb.AppendLine("## PREVIOUS OUTPUT");
            sb.AppendLine(JsonSerializer.Serialize(previousResult, SightFactJsonOptions.Options));
            sb.AppendLine();
            sb.AppendLine("## USER FEEDBACK");
            sb.AppendLine($"The user reviewed the previous output and said: \"{feedback}\"");
            sb.AppendLine();
            sb.AppendLine("Revise the output to address this feedback, following all the same accuracy and style rules. Output the complete revised JSON, not just the changed parts.");
        }

        return sb.ToString();
    }
}
