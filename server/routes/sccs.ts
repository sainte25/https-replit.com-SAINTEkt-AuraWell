// SCCS and Multi-touch Delivery API Routes
import { Router } from 'express';
import { sccsReportingService } from '../services/sccsReporting';
import { coreSessionService } from '../services/coreSession';
import { customerIOService } from '../services/customerio';

const router = Router();
const mockUserId = "user123";

// Start core self-discovery session
router.post('/session/start', async (req, res) => {
  try {
    const sessionMemory = coreSessionService.initializeSession(mockUserId);
    const welcomeMessage = coreSessionService.getWelcomeMessage();
    
    res.json({
      sessionId: sessionMemory.activeSession,
      message: welcomeMessage,
      nextPrompt: "How would you describe yourself right now — not your label, but what you feel or believe about who you are?",
      memory: sessionMemory
    });
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Process core session response
router.post('/session/respond', async (req, res) => {
  try {
    const { sessionMemory, userResponse } = req.body;
    
    if (!sessionMemory || !userResponse) {
      return res.status(400).json({ error: 'Session memory and user response required' });
    }

    const result = await coreSessionService.processSessionResponse(
      mockUserId,
      sessionMemory,
      userResponse
    );

    res.json(result);
  } catch (error) {
    console.error('Session response error:', error);
    res.status(500).json({ error: 'Failed to process session response' });
  }
});

// Get domain reflection prompts
router.get('/reflection/prompts/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const prompts = sccsReportingService.getDomainPrompts(domain);
    
    res.json({
      domain,
      prompts,
      purpose: `Reflect on ${domain.toLowerCase()} progress and needs`
    });
  } catch (error) {
    console.error('Domain prompts error:', error);
    res.status(500).json({ error: 'Failed to get domain prompts' });
  }
});

// Submit domain reflection
router.post('/reflection/submit', async (req, res) => {
  try {
    const { domain, response, actionStep } = req.body;
    
    if (!domain || !response) {
      return res.status(400).json({ error: 'Domain and response required' });
    }

    // Detect emotional tone (simplified)
    const emotionalTone = response.toLowerCase().includes('overwhelmed') ? 'overwhelmed' :
                         response.toLowerCase().includes('hopeful') ? 'hopeful' :
                         response.toLowerCase().includes('stressed') ? 'stressed' : 'neutral';

    // Calculate SCCS points
    const sccsPoints = sccsReportingService.calculateDomainSCCS(
      domain, 
      !!actionStep, 
      emotionalTone
    );

    // Save reflection
    await sccsReportingService.saveReflection({
      userId: mockUserId,
      domain,
      reflectionText: response,
      tone: emotionalTone,
      actionStep,
      sccsPointsAwarded: sccsPoints
    });

    // Log SCCS contribution
    await sccsReportingService.logSCCSContribution({
      userId: mockUserId,
      category: `${domain.toLowerCase()}_reflection`,
      description: `Domain reflection: ${domain}`,
      points: sccsPoints,
      source: 'domain_reflection'
    });

    res.json({
      message: 'Reflection saved successfully',
      sccsPointsAwarded: sccsPoints,
      emotionalTone,
      domain
    });
  } catch (error) {
    console.error('Reflection submission error:', error);
    res.status(500).json({ error: 'Failed to submit reflection' });
  }
});

// Get SCCS summary for sharing
router.get('/summary/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || mockUserId;
    const { startDate, endDate } = req.query;
    
    const dateRange = `${startDate || 'Aug 1'} – ${endDate || 'Aug 4'}, 2025`;
    const summary = await sccsReportingService.generateSCCSSummary(userId, dateRange);
    
    res.json(summary);
  } catch (error) {
    console.error('SCCS summary error:', error);
    res.status(500).json({ error: 'Failed to generate SCCS summary' });
  }
});

// Trigger domain check-in (for testing Customer.io flow)
router.post('/checkin/trigger', async (req, res) => {
  try {
    const { domain, triggerType } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain required' });
    }

    await sccsReportingService.triggerDomainCheckin(
      mockUserId,
      domain,
      triggerType || 'manual'
    );

    res.json({
      message: `Domain check-in triggered for ${domain}`,
      userId: mockUserId,
      triggerType: triggerType || 'manual'
    });
  } catch (error) {
    console.error('Check-in trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger check-in' });
  }
});

// Test Customer.io event triggering
router.post('/trigger/test', async (req, res) => {
  try {
    const { eventType, eventData, priority } = req.body;
    
    await customerIOService.sendCustomerIOEvent({
      userId: mockUserId,
      eventType: eventType || 'emotional_tone_flag',
      eventData: eventData || { tone: 'test' },
      priority: priority || 'medium'
    });

    res.json({
      message: 'Customer.io event triggered successfully',
      eventType,
      priority
    });
  } catch (error) {
    console.error('Customer.io trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger Customer.io event' });
  }
});

export default router;