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
import { getCases, Case as CaseModel } from "@/lib/api"; // Import CaseModel from api.ts

export default function CasePage() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState<CaseModel | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [cases, setCases] = React.useState<CaseModel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCases = async () => {
      try {
        const fetchedCases = await getCases();
        setCases(fetchedCases);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const openDialog = (caseItem: CaseModel) => {
    setSelectedCase(caseItem);
    setOpen(true);
  };

  // ⇒ Navigate to "/interview" when user clicks “Proceed”
  const proceed = () => {
    if (selectedCase) {
      // Store selected case ID in localStorage to pass to the interview page
      localStorage.setItem("selectedCaseId", selectedCase.id);
      router.push("/interview");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-black text-white">Loading cases...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen bg-black text-white">Error: {error}</div>;
  }

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
                  {caseItem.name} {/* Display case name instead of company */}
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
              <CarouselItem key={caseItem.id} className="pl-4 basis-1/4"> {/* Use caseItem.id as key */}
                <div
                  onClick={() => openDialog(caseItem)}
                  className="cursor-pointer"
                >
                  <Card className="bg-black border border-gray-500">
                    <CardContent className="p-6 h-96 flex flex-col justify-center">
                      <h3 className="text-2xl font-semibold text-white">
                        {caseItem.name} {/* Display case name */}
                      </h3>
                      <p className="mt-2 text-base text-gray-400">
                        {/* Ensure description fields match CaseModel from api.ts */}
                        Client: {caseItem.description.client_name} <br />
                        Goal: {caseItem.description.client_goal}
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
