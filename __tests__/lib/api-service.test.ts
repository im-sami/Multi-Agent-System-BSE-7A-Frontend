import { fetchAgents, submitRequest, checkHealth } from "@/lib/api-service"
import { jest } from "@jest/globals"

// Mock fetch
global.fetch = jest.fn()

describe("API Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchAgents", () => {
    it("fetches agents from API", async () => {
      const mockAgents = [{ id: "1", name: "Agent 1", description: "Test agent 1" }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ agents: mockAgents }),
      })

      const result = await fetchAgents()

      expect(result).toEqual(mockAgents)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/supervisor/registry"), expect.any(Object))
    })

    it("handles fetch errors", async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

      await expect(fetchAgents()).rejects.toThrow("Network error")
    })
  })

  describe("submitRequest", () => {
    it("submits request to agent", async () => {
      const mockResponse = {
        response: "Test response",
        agentId: "1",
        timestamp: new Date().toISOString(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await submitRequest("1", "Test request", false)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/supervisor/request"),
        expect.objectContaining({
          method: "POST",
        }),
      )
    })
  })

  describe("checkHealth", () => {
    it("checks agent health status", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "healthy" }),
      })

      const result = await checkHealth("1")

      expect(result).toBe("healthy")
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/agent/1/health"), expect.any(Object))
    })
  })
})
