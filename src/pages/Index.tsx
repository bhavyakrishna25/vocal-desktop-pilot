import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Calculator, Globe, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface VoiceCommand {
  command: string;
  response: string;
  timestamp: Date;
}

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      synthRef.current = window.speechSynthesis;

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          processVoiceCommand(result);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Voice Recognition Error",
            description: "Please try again or check microphone permissions.",
            variant: "destructive",
          });
        };
      }
    }
  }, []);

  const speak = (text: string) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthRef.current.speak(utterance);
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    let response = "Command not recognized.";

    // Calculator commands
    if (lowerCommand.includes('plus') || lowerCommand.includes('add')) {
      response = handleCalculation(lowerCommand, '+');
    } else if (lowerCommand.includes('minus') || lowerCommand.includes('subtract')) {
      response = handleCalculation(lowerCommand, '-');
    } else if (lowerCommand.includes('times') || lowerCommand.includes('multiply')) {
      response = handleCalculation(lowerCommand, '*');
    } else if (lowerCommand.includes('divided by') || lowerCommand.includes('divide')) {
      response = handleCalculation(lowerCommand, '/');
    }
    // Web navigation commands
    else if (lowerCommand.includes('open') && lowerCommand.includes('website')) {
      response = handleWebNavigation(lowerCommand);
    } else if (lowerCommand.includes('search for')) {
      response = handleSearch(lowerCommand);
    }
    // Application commands
    else if (lowerCommand.includes('open calculator')) {
      response = "Calculator mode activated. You can now perform calculations.";
    } else if (lowerCommand.includes('what time is it')) {
      response = `The current time is ${new Date().toLocaleTimeString()}`;
    } else if (lowerCommand.includes('what date is it')) {
      response = `Today is ${new Date().toLocaleDateString()}`;
    }

    // Add to history
    const newCommand: VoiceCommand = {
      command,
      response,
      timestamp: new Date()
    };
    setCommandHistory(prev => [newCommand, ...prev.slice(0, 9)]);

    // Speak response
    speak(response);

    toast({
      title: "Command Processed",
      description: response,
    });
  };

  const handleCalculation = (command: string, operator: string) => {
    const numbers = command.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const num1 = parseInt(numbers[0]);
      const num2 = parseInt(numbers[1]);
      let result = 0;

      switch (operator) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '*':
          result = num1 * num2;
          break;
        case '/':
          result = num2 !== 0 ? num1 / num2 : 0;
          break;
      }

      return `${num1} ${operator === '+' ? 'plus' : operator === '-' ? 'minus' : operator === '*' ? 'times' : 'divided by'} ${num2} equals ${result}`;
    }
    return "Please provide two numbers for calculation.";
  };

  const handleWebNavigation = (command: string) => {
    const websiteMatch = command.match(/open\s+(.+?)\s+website/);
    if (websiteMatch) {
      const siteName = websiteMatch[1].toLowerCase();
      let url = `https://www.${siteName}.com`;
      
      // Handle common sites
      if (siteName.includes('google')) url = 'https://www.google.com';
      else if (siteName.includes('youtube')) url = 'https://www.youtube.com';
      else if (siteName.includes('github')) url = 'https://www.github.com';
      else if (siteName.includes('facebook')) url = 'https://www.facebook.com';
      else if (siteName.includes('twitter') || siteName.includes('x')) url = 'https://www.x.com';
      else if (siteName.includes('instagram')) url = 'https://www.instagram.com';
      else if (siteName.includes('linkedin')) url = 'https://www.linkedin.com';
      else if (siteName.includes('amazon')) url = 'https://www.amazon.com';
      else if (siteName.includes('netflix')) url = 'https://www.netflix.com';
      else if (siteName.includes('wikipedia')) url = 'https://www.wikipedia.org';
      else if (siteName.includes('stack overflow') || siteName.includes('stackoverflow')) url = 'https://stackoverflow.com';
      else if (siteName.includes('reddit')) url = 'https://www.reddit.com';
      else if (siteName.includes('tiktok')) url = 'https://www.tiktok.com';
      else if (siteName.includes('discord')) url = 'https://discord.com';
      else if (siteName.includes('twitch')) url = 'https://www.twitch.tv';
      else if (siteName.includes('spotify')) url = 'https://open.spotify.com';
      else if (siteName.includes('pinterest')) url = 'https://www.pinterest.com';
      
      window.open(url, '_blank');
      return `Opening ${siteName} website`;
    }
    return "Please specify which website to open.";
  };

  const handleSearch = (command: string) => {
    const searchMatch = command.match(/search for (.+)/);
    if (searchMatch) {
      const query = searchMatch[1];
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(searchUrl, '_blank');
      return `Searching for ${query}`;
    }
    return "Please specify what to search for.";
  };

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Browser Not Supported</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-1">
      <div className="w-72 mx-auto space-y-2">
        <div className="text-center">
          <h1 className="text-sm font-bold mb-1">Voice Assistant</h1>
        </div>

        {/* Voice Control Panel */}
        <Card className="compact-widget">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-center">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                onClick={isListening ? stopListening : startListening}
                className="w-20 h-20 rounded-full"
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {isListening ? "Listening..." : "Click to start"}
            </p>
            {transcript && (
              <div className="p-2 bg-muted rounded-md">
                <p className="text-xs"><strong>Last:</strong> {transcript}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Commands */}
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-2">Commands:</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span>"14 plus 3"</span>
              <span>"Open YouTube"</span>
              <span>"What time is it"</span>
              <span>"Search for cats"</span>
            </div>
          </CardContent>
        </Card>

        {/* Latest Command */}
        {commandHistory.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Latest:</p>
              <p className="text-xs font-medium truncate">{commandHistory[0].command}</p>
              <p className="text-xs text-muted-foreground truncate">{commandHistory[0].response}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;