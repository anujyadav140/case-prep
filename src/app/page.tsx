"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Search, Upload } from "lucide-react";

interface CaseModel {
  name: string;
  company: string;
  source: string;
  url: string;
  description: {
    client_name: string;
    client_goal: string;
    client_description: string;
    situation_description: string;
  };
}

// Replace or augment this static array with a real API call if needed:
const cases: CaseModel[] = [
  {
    name: "Practice Case",
    company: "Beautify",
    source: "McKinsey Study",
    url: "https://www.mckinsey.com/careers/interviewing/beautify",
    description: {
      client_name: "Beautify",
      client_goal:
        "Our client is Beautify. Beautify has approached McKinsey for help with exploring new ways to approach its customers.",
      client_description:
        "Beautify is a global prestige cosmetics company operating in luxury department stores and online. They rely on in‐store beauty consultants for personalized engagement. With the shift towards digital, many stores are underused and consultants have idle capacity.",
      situation_description:
        "Beautify’s leadership asked us to assess the profitability of training beauty consultants to sell virtually through social media and their own e‐commerce pages.",
    },
  },
  {
    name: "GreenTech Growth",
    company: "GreenTech",
    source: "BCG Internal",
    url: "https://www.bcg.com/insights/greentech-growth",
    description: {
      client_name: "GreenTech",
      client_goal:
        "GreenTech wants to expand its portfolio of renewable energy solutions into emerging markets while maintaining cost leadership.",
      client_description:
        "GreenTech manufactures solar panels and wind turbines. They currently serve North America and Europe but see untapped demand in Asia-Pacific and Africa. Local regulations and infrastructure pose complexity.",
      situation_description:
        "The client asked us to develop a market‐entry strategy and cost optimization plan to achieve 15% market share in new regions within three years.",
    },
  },
  {
    name: "Foodie App Launch",
    company: "Foodie",
    source: "Deloitte Report",
    url: "https://www.deloitte.com/foodie-app-launch",
    description: {
      client_name: "Foodie",
      client_goal:
        "Foodie aims to launch a mobile app connecting home chefs with local customers for on‐demand meal delivery.",
      client_description:
        "Foodie is a startup that wants to disrupt the restaurant industry by enabling peer‐to‐peer meal experiences. They have MVP in San Francisco and want to scale nationally.",
      situation_description:
        "They engaged us to refine their business model, forecast user adoption, and design incentive structures for early adopters.",
    },
  },
  {
    name: "TravelX Revamp",
    company: "TravelX",
    source: "PwC Analysis",
    url: "https://www.pwc.com/travelx-revamp",
    description: {
      client_name: "TravelX",
      client_goal:
        "TravelX needs to modernize its legacy booking platform to improve user experience and reduce operational costs.",
      client_description:
        "TravelX is an established online travel agency with millions of annual bookings. Their current monolithic system causes slow load times and high maintenance overhead.",
      situation_description:
        "They requested our help to architect a microservices-based platform, estimate ROI, and plan a phased migration with minimal downtime.",
    },
  },
];

export default function CasePage() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseModel | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);

  const openDialog = (caseItem: CaseModel) => {
    setSelectedCase(caseItem);
    setOpen(true);
  };

  // ⇒ Navigate to "/interview" when user clicks “Proceed”
  const proceed = () => {
    // You might store the selectedCase in localStorage or a React context
    // so that /interview can read it. For now, we’ll do a simple push:
    router.push("/interview");
  };

  return (
    <>
      {/* App Bar */}
      <header className="fixed top-0 left-0 w-full bg-black border-b border-gray-500 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-6">
          <h1 className="text-xl font-bold text-white">Case Interview Dojo</h1>
          <div className="flex items-center space-x-4">
            {/* Search Icon Button */}
            <Button
              variant="ghost"
              className="p-2 text-white hover:bg-gray-800"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
            {/* Upload Document Button */}
            <Button
              variant="outline"
              className="bg-black border-gray-500 text-white hover:bg-gray-800 p-2 flex items-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="bg-black border border-gray-500">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">All Cases</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a case to view details
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-64 overflow-y-auto">
            <ul className="space-y-2">
              {cases.map((caseItem) => (
                <li
                  key={caseItem.name}
                  className="text-white cursor-pointer hover:underline"
                  onClick={() => {
                    openDialog(caseItem);
                    setSearchOpen(false);
                  }}
                >
                  {caseItem.company}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-500 text-white p-3"
              onClick={() => setSearchOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Content */}
      <div className="flex justify-center items-center bg-black min-h-screen pt-20 p-6">
        <Carousel className="w-full max-w-5xl">
          <CarouselContent className="-ml-1">
            {cases.map((caseItem) => (
              <CarouselItem key={caseItem.name} className="pl-4 basis-1/4">
                <div
                  onClick={() => openDialog(caseItem)}
                  className="cursor-pointer"
                >
                  <Card className="bg-black border border-gray-500">
                    <CardContent className="p-6 h-96 flex flex-col justify-center">
                      <h3 className="text-2xl font-semibold text-white">
                        {caseItem.company}
                      </h3>
                      <p className="mt-2 text-base text-gray-400">
                        {caseItem.description.client_description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-black text-white border border-gray-500 rounded-full p-3" />
          <CarouselNext className="bg-black text-white border border-gray-500 rounded-full p-3" />
        </Carousel>

        {selectedCase && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black border border-gray-500">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl">
                  {selectedCase.name}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedCase.description.client_goal}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <p className="text-white text-base">
                  {selectedCase.description.situation_description}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-gray-500 text-black bg-white p-3"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gray-700 text-white p-3"
                  onClick={proceed}
                >
                  Proceed
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
