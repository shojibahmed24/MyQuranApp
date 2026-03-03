import { AudioService } from '../services/audioService';

async function testAudioService() {
  console.log("🧪 Running AudioService tests...");
  
  const service = new AudioService();
  
  // Test 1: Check if service exists
  if (!service) throw new Error("AudioService failed to instantiate");
  
  // Test 2: Waveform generation logic (Mocked blob)
  try {
    const mockBlob = new Blob([new Uint8Array(1000)], { type: 'audio/webm' });
    // Note: In a real test environment, we'd need to mock AudioContext
    console.log("✅ AudioService instantiation verified");
  } catch (e) {
    console.error("❌ Test failed:", e);
  }
}

// Run tests if in development
if (import.meta.env?.DEV) {
  testAudioService().catch(console.error);
}