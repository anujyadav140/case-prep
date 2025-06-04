from backend.database.models import CaseInterview, Description, Question
from typing import List

cases: List[CaseInterview] = [
   CaseInterview(
    name="Practice Case",
    company="Beautify",
    source="McKinsey Study",
    url="https://www.mckinsey.com/careers/interviewing/beautify",
    description=Description(
        client_name="Beautify",
        client_goal=(
            "Our client is Beautify. Beautify has approached McKinsey for help with "
            "exploring new ways to approach its customers."
        ),
        client_description=(
            "Beautify is a global prestige cosmetics company that sells its products "
            "mainly inside high-end department stores such as Harrods and Shanghai No. 1. "
            "It also has a presence online with specialty retailers like Sephora. "
            "Beautify produces a number of makeup, fragrance, and skin care products sold "
            "under several different brands.\n\n"
            "In department stores, beauty consultants play a critical role with consumers:\n"
            "- approaching “passive” customers\n"
            "- demonstrating their knowledge of the products\n"
            "- actively selling the products\n"
            "- maintaining a loyal customer base of repeat buyers\n\n"
            "These consultants are hired directly by Beautify or through specialist, third-party "
            "agencies that find new recruits for a fee. Beautify selects, trains, and pays them; "
            "within Beautify, they’re managed independently by brand and country. However, as "
            "consumers shift online, too many consultants are left working in empty department stores."
        ),
        situation_description=(
            "Beautify’s president and COO engaged McKinsey to help evaluate if training the majority "
            "of beauty consultants to use virtual channels to connect with customers could be profitable."
        ),
        company_study="",  
        global_hints=[
            "Write down important information.",
            "Feel free to ask the interviewer to explain anything that is not clear to you."
        ],
        questions=[
            Question(
                text=(
                    "Beautify is excited to support its current staff of beauty consultants on the journey "
                    "to becoming virtual social media-beauty advisors. Consultants would still lead the way "
                    "in terms of direct consumer engagement and would be expected to maintain and grow a "
                    "group of clients. They would sell products through their own pages on beautify.com, make "
                    "appearances at major retail outlets, and be active on all social media platforms.\n\n"
                    "What possible factors should Beautify consider when shifting this group of employees "
                    "toward a new set of responsibilities?"
                ),
                hints=[
                    "Take time to organize your thoughts before answering. This will help show your interviewer that you have a logical approach.",
                    "Develop an overall approach before diving into details."
                ],
                reveal_answer=(
                    "Some of the factors you might discuss:\n"
                    "- **Retailer response:** How will department stores react to direct online sales? What financial arrangements are needed?\n"
                    "- **Competitor response:** Are rivals already using virtual advisors? How successful are they, or are they planning similar moves?\n"
                    "- **Current capabilities:** How digitally savvy are current consultants? How many already have social-media presence or blogs?\n"
                    "- **Brand image:** What’s the impact on Beautify’s brand if hundreds of advisors start posting about products? Could this boost employer attractiveness?"
                )
            ),
            Question(
                text=(
                    "Imagine you are a current Beautify customer who shops in-store for the high-touch service. "
                    "What features would make you consider switching to a mostly virtual sales experience?"
                ),
                hints=[
                    "Group your thoughts around the key issues to ensure relevance."
                ],
                reveal_answer=(
                    "Possible features:\n"
                    "- **Real-time feedback on looks:** A “selfie mirror” app for tailored product recommendations.\n"
                    "- **Online community:** Closed groups or blogs for discussions and tips among similar users.\n"
                    "- **Trusted trend updates:** Frequent social-media posts with tutorials, reviews, myth-busting.\n"
                    "- **Private consultations:** One-on-one messaging for personalized skincare advice."
                )
            ),
            Question(
                text=(
                    "Using these assumptions—10% incremental revenue (€130 M), upfront investment of €150 M, "
                    "and annual advisor costs of €10 M—how many years until the initiative turns profitable?"
                ),
                hints=[
                    "Talk through your calculation steps clearly.",
                    "Remember: incremental revenues = 10% of €1.3 B = €130 M; profits = €130 M – €10 M = €120 M; payback = €150 M/€120 M."
                ],
                reveal_answer=(
                    "Payback period = €150 M investment ÷ €120 M annual profit = 1.25 years (one year and three months)."
                )
            )
        ]
    )
),
]
