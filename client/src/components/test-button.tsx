import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TestButton() {
  const { toast } = useToast();

  const handleClick = () => {
    console.log('🔥 Test button clicked successfully!');
    toast({
      title: "Button Works!",
      description: "Click functionality is working correctly",
    });
  };

  return (
    <div className="fixed top-20 left-4 z-[9999] bg-green-500 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-2">Button Test</h3>
      <Button 
        onClick={handleClick}
        className="bg-blue-500 hover:bg-blue-600 text-white"
        style={{
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          cursor: 'pointer',
          zIndex: 10000,
          position: 'relative'
        }}
      >
        TEST CLICK
      </Button>
      <button 
        onClick={handleClick}
        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded block"
        style={{
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          cursor: 'pointer',
          zIndex: 10000,
          position: 'relative'
        }}
      >
        Native Button Test
      </button>
    </div>
  );
}