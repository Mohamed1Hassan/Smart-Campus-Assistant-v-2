"use client";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { vi, describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import Navbar from "../Navbar";
import { useAuth } from "../../contexts/AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
vi.mock("../../contexts/AuthContext");
const mockUseLogout = vi.fn();
(useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
  logout: mockUseLogout,
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("Navbar", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLogout.mockReturnValue({
      logout: mockLogout,
      isLoading: false,
    });
  });

  it("renders with default props", () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByText("Ahmed Hassan")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search courses, professors, exams..."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
    expect(screen.getByTestId("dark-mode-toggle")).toBeInTheDocument();
  });

  it("renders with custom userName and userAvatar", () => {
    const customAvatar = "https://example.com/avatar.jpg";
    renderWithRouter(<Navbar userName="John Doe" userAvatar={customAvatar} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByAltText("John Doe")).toBeInTheDocument();
    expect(screen.getByAltText("John Doe")).toHaveAttribute(
      "src",
      customAvatar,
    );
  });

  it("renders initials when no avatar is provided", () => {
    renderWithRouter(<Navbar userName="John Doe" />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("displays correct unread notification count", () => {
    renderWithRouter(<Navbar />);

    // Should show 2 unread notifications (from mock data)
    expect(screen.getByText("Notifications (2) - student")).toBeInTheDocument();
  });

  it("opens logout confirmation modal when logout button is clicked", () => {
    renderWithRouter(<Navbar />);

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();
    expect(screen.getByText("Confirm Logout")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to log out?"),
    ).toBeInTheDocument();
  });

  it("calls logout function when confirmed", async () => {
    mockLogout.mockResolvedValue(true);
    renderWithRouter(<Navbar />);

    // Open modal
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    // Confirm logout
    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it("shows success toast after successful logout", async () => {
    mockLogout.mockResolvedValue(true);
    renderWithRouter(<Navbar />);

    // Open modal and confirm logout
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      expect(screen.getByText("Logged out successfully")).toBeInTheDocument();
    });
  });

  it("does not show toast after failed logout", async () => {
    mockLogout.mockResolvedValue(false);
    renderWithRouter(<Navbar />);

    // Open modal and confirm logout
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    // Toast should not be shown
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("closes modal when cancel is clicked", () => {
    renderWithRouter(<Navbar />);

    // Open modal
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(screen.getByTestId("confirm-modal")).toBeInTheDocument();

    // Cancel logout
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId("confirm-modal")).not.toBeInTheDocument();
  });

  it("navigates to profile when profile button is clicked", () => {
    renderWithRouter(<Navbar />);

    const profileButton = screen.getByText("Go to Ahmed Hassan's profile");
    fireEvent.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("shows loading state in logout modal", () => {
    mockUseLogout.mockReturnValue({
      logout: mockLogout,
      isLoading: true,
    });

    renderWithRouter(<Navbar />);

    // Open modal
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeDisabled();
  });

  it("closes toast when close button is clicked", async () => {
    mockLogout.mockResolvedValue(true);
    renderWithRouter(<Navbar />);

    // Trigger logout and show toast
    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByTestId("toast")).toBeInTheDocument();
    });

    // Close toast
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    renderWithRouter(<Navbar userName="John Doe" />);

    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toHaveAttribute("aria-label", "Logout");
    expect(logoutButton).toHaveAttribute("title", "Logout");

    const profileButton = screen.getByText("Go to John Doe's profile");
    expect(profileButton).toHaveAttribute(
      "aria-label",
      "Go to John Doe's profile",
    );
    expect(profileButton).toHaveAttribute("title", "View Profile");
  });

  it("handles search input correctly", () => {
    renderWithRouter(<Navbar />);

    const searchInput = screen.getByPlaceholderText(
      "Search courses, professors, exams...",
    );
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("type", "text");

    fireEvent.change(searchInput, { target: { value: "test search" } });
    expect(searchInput).toHaveValue("test search");
  });
});
