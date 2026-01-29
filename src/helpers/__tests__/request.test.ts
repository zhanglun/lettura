import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { createInstance, get, post, put, _delete } from "@/helpers/request";

vi.mock("axios");

describe("request helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInstance", () => {
    it("should create an axios instance with config", () => {
      const config = { timeout: 5000 };
      const mockInstance = { get: vi.fn(), post: vi.fn() };
      (axios.create as any).mockReturnValue(mockInstance);

      const instance = createInstance(config);

      expect(axios.create).toHaveBeenCalledWith(config);
      expect(instance).toBe(mockInstance);
    });

    it("should set baseURL from localStorage port", () => {
      const config = {};
      const mockInstance = { get: vi.fn() };
      (axios.create as any).mockReturnValue(mockInstance);

      createInstance(config);

      expect(axios.defaults.baseURL).toBe("http://localhost:3000/api");
    });
  });

  describe("get", () => {
    it("should make a GET request and return response", async () => {
      const mockResponse = { data: { result: "success" }, status: 200 };
      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const result = await get("/test-endpoint");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/test-endpoint",
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should pass config parameters to GET request", async () => {
      const mockResponse = { data: {}, status: 200 };
      const mockAxiosInstance = {
        get: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const config = { params: { id: 1 } };
      await get("/test", config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/test", config);
    });
  });

  describe("post", () => {
    it("should make a POST request with data", async () => {
      const mockResponse = { data: { id: 123 }, status: 201 };
      const mockAxiosInstance = {
        post: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const data = { name: "test" };
      const result = await post("/create", data);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/create",
        data,
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should pass config parameters to POST request", async () => {
      const mockResponse = { data: {}, status: 201 };
      const mockAxiosInstance = {
        post: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const data = { name: "test" };
      const config = { headers: { "Content-Type": "application/json" } };
      await post("/create", data, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/create",
        data,
        config,
      );
    });
  });

  describe("put", () => {
    it("should make a PUT request with data", async () => {
      const mockResponse = { data: { id: 123, name: "updated" }, status: 200 };
      const mockAxiosInstance = {
        put: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const data = { name: "updated" };
      const result = await put("/update/123", data);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/update/123",
        data,
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("delete", () => {
    it("should make a DELETE request", async () => {
      const mockResponse = { data: { message: "deleted" }, status: 200 };
      const mockAxiosInstance = {
        delete: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const result = await _delete("/delete/123");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/delete/123",
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should pass config parameters to DELETE request", async () => {
      const mockResponse = { data: {}, status: 200 };
      const mockAxiosInstance = {
        delete: vi.fn().mockResolvedValue(mockResponse),
      };

      (axios.create as any).mockReturnValue(mockAxiosInstance);

      const config = { headers: { "X-Auth": "token" } };
      await _delete("/delete/123", config);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/delete/123",
        config,
      );
    });
  });
});
