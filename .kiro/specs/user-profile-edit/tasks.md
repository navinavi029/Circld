# Implementation Plan: User Profile Edit Feature

## Overview

This implementation plan breaks down the user profile edit feature into discrete coding tasks. The feature adds profile editing capabilities with photo upload, integrating with existing Firebase/Firestore infrastructure and the Cloudinary upload utility. Tasks are ordered to build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Extend UserProfile type with photoUrl field
  - Add photoUrl field to UserProfile interface in src/types/user.ts
  - Add photoUrl field to CreateUserProfile interface
  - Set photoUrl as optional (string | null type)
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create useProfileUpdate hook for profile updates
  - [x] 2.1 Implement useProfileUpdate hook
    - Create src/hooks/useProfileUpdate.ts
    - Define ProfileUpdateData interface
    - Implement updateProfile function using Firestore updateDoc
    - Handle loading, error, and success states
    - Get user uid from AuthContext
    - Validate user is authenticated before updating
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 2.2 Write property test for correct document targeting
    - **Property 11: Correct document targeting**
    - **Validates: Requirements 5.2**
  
  - [x] 2.3 Write property test for update error display
    - **Property 12: Update error display**
    - **Validates: Requirements 5.4**
  
  - [x] 2.4 Write property test for profile update round-trip
    - **Property 13: Profile update round-trip**
    - **Validates: Requirements 5.5**
  
  - [x] 2.5 Write unit tests for useProfileUpdate hook
    - Test error when user not authenticated
    - Test success state after successful update
    - Test error clearing on new update
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Create ProfilePhotoUpload component
  - [x] 3.1 Implement ProfilePhotoUpload component
    - Create src/components/ProfilePhotoUpload.tsx
    - Define ProfilePhotoUploadProps interface
    - Implement file input and preview functionality
    - Use URL.createObjectURL for preview generation
    - Call uploadToCloudinary on upload
    - Handle upload progress and errors
    - Clean up preview URLs on unmount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 3.2 Write property test for valid image type acceptance
    - **Property 5: Valid image type acceptance**
    - **Validates: Requirements 3.2**
  
  - [x] 3.3 Write property test for invalid file type rejection
    - **Property 6: Invalid file type rejection**
    - **Validates: Requirements 3.3**
  
  - [x] 3.4 Write property test for image preview generation
    - **Property 7: Image preview generation**
    - **Validates: Requirements 3.4**
  
  - [x] 3.5 Write property test for photo URL storage
    - **Property 8: Photo URL storage after upload**
    - **Validates: Requirements 1.4, 3.6**
  
  - [x] 3.6 Write property test for upload error display
    - **Property 9: Upload error display**
    - **Validates: Requirements 3.7, 6.5**
  
  - [x] 3.7 Write unit tests for ProfilePhotoUpload
    - Test rendering with no photo (placeholder)
    - Test rendering with existing photo URL
    - Test invalid file type error display
    - _Requirements: 3.2, 3.3, 3.4, 3.7_

- [x] 4. Checkpoint - Ensure core components work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create EditProfile page component
  - [x] 5.1 Implement EditProfile page
    - Create src/pages/EditProfile.tsx
    - Load profile data using useUserProfile hook
    - Implement form state management (name, location, eligibleToMatch, photoUrl)
    - Implement validation for name and location fields
    - Track form changes to enable/disable save button
    - Integrate ProfilePhotoUpload component
    - Call useProfileUpdate on save
    - Display success/error messages
    - Provide cancel button to navigate back to Dashboard
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 5.2 Write property test for profile data population
    - **Property 1: Profile data population on load**
    - **Validates: Requirements 2.2**
  
  - [x] 5.3 Write property test for empty name validation
    - **Property 2: Empty name validation**
    - **Validates: Requirements 2.3, 7.1**
  
  - [x] 5.4 Write property test for empty location validation
    - **Property 3: Empty location validation**
    - **Validates: Requirements 2.4, 7.2**
  
  - [x] 5.5 Write property test for toggle state update
    - **Property 4: Toggle state update**
    - **Validates: Requirements 2.5**
  
  - [x] 5.6 Write property test for save button state
    - **Property 15: Save button state based on validation**
    - **Validates: Requirements 7.3, 7.4**
  
  - [x] 5.7 Write property test for error clearing on retry
    - **Property 14: Error clearing on retry**
    - **Validates: Requirements 6.6**
  
  - [x] 5.8 Write unit tests for EditProfile page
    - Test rendering with loading state
    - Test rendering with error state
    - Test save button disabled when validation errors exist
    - Test save button disabled when no changes made
    - _Requirements: 6.1, 7.3, 7.4_

- [ ] 6. Enhance Dashboard to display profile photo
  - [x] 6.1 Update Dashboard component
    - Modify src/pages/Dashboard.tsx
    - Add profile photo display in User Information Card
    - Show circular profile photo if photoUrl exists
    - Show default avatar icon if photoUrl is null
    - Add "Edit Profile" button that navigates to /edit-profile
    - Style photo with appropriate sizing (80x80px or 100x100px)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1_
  
  - [x] 6.2 Write property test for profile photo display
    - **Property 10: Profile photo display with URL**
    - **Validates: Requirements 4.1**
  
  - [x] 6.3 Write property test for navigation to edit profile
    - **Property 16: Navigation to edit profile**
    - **Validates: Requirements 8.2**
  
  - [x] 6.4 Write unit tests for Dashboard enhancements
    - Test edit profile button renders
    - Test default avatar when photoUrl is null
    - _Requirements: 4.2, 8.1_

- [ ] 7. Add routing for EditProfile page
  - [x] 7.1 Update App.tsx with edit-profile route
    - Add route for /edit-profile
    - Wrap EditProfile in ProtectedRoute
    - Ensure route requires authentication
    - _Requirements: 8.2, 8.3_
  
  - [x] 7.2 Write property test for protected route authentication
    - **Property 17: Protected route authentication**
    - **Validates: Requirements 8.3**
  
  - [x] 7.3 Write unit test for edit profile route
    - Test route redirects when unauthenticated
    - _Requirements: 8.3_

- [ ] 8. Update user registration to include photoUrl field
  - [x] 8.1 Update AuthContext register function
    - Modify src/contexts/AuthContext.tsx
    - Add photoUrl: null to user profile creation in register function
    - Ensure new users have photoUrl field initialized
    - _Requirements: 1.3_
  
  - [x] 8.2 Write unit test for registration with photoUrl
    - Test new user profile includes photoUrl: null
    - _Requirements: 1.3_

- [x] 9. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The feature integrates with existing Firebase/Firestore and Cloudinary infrastructure
- All photo uploads use the existing uploadToCloudinary function from src/utils/cloudinary.ts
