# Requirements Document

## Introduction

This document specifies the requirements for a user profile edit feature that allows users to update their profile information and upload a profile photo. The feature integrates with the existing Firebase Authentication and Firestore infrastructure, and uses the existing Cloudinary image upload utility for photo management.

## Glossary

- **Profile_Editor**: The component that provides the user interface for editing profile information
- **Profile_Service**: The service layer that handles profile data operations with Firestore
- **Photo_Uploader**: The component that handles profile photo upload using Cloudinary
- **UserProfile**: The data model representing user profile information stored in Firestore
- **Dashboard**: The main user interface displaying user information after authentication
- **Cloudinary_Service**: The existing utility service for uploading images to Cloudinary

## Requirements

### Requirement 1: Profile Data Model Extension

**User Story:** As a developer, I want to extend the UserProfile type to include photo storage, so that profile photos can be persisted and retrieved.

#### Acceptance Criteria

1. THE UserProfile type SHALL include a photoUrl field of type string or null
2. THE UserProfile type SHALL include a photoUrl field in the CreateUserProfile interface
3. WHEN a user has no profile photo, THE photoUrl field SHALL be null
4. WHEN a user uploads a profile photo, THE photoUrl field SHALL contain the Cloudinary secure URL

### Requirement 2: Profile Edit Interface

**User Story:** As a user, I want to edit my profile information, so that I can keep my details current and accurate.

#### Acceptance Criteria

1. THE Profile_Editor SHALL provide input fields for name, location, and eligible_to_match status
2. WHEN the Profile_Editor loads, THE system SHALL populate fields with current profile data
3. WHEN a user modifies the name field, THE system SHALL validate that it is not empty
4. WHEN a user modifies the location field, THE system SHALL validate that it is not empty
5. WHEN a user toggles eligible_to_match, THE system SHALL update the field value immediately
6. THE Profile_Editor SHALL provide a save button to persist changes
7. THE Profile_Editor SHALL provide a cancel button to discard changes

### Requirement 3: Profile Photo Upload

**User Story:** As a user, I want to upload a profile photo, so that I can personalize my profile and be recognized by others.

#### Acceptance Criteria

1. THE Photo_Uploader SHALL use the existing uploadToCloudinary function from src/utils/cloudinary.ts
2. THE Photo_Uploader SHALL accept image files in JPEG, PNG, GIF, and WebP formats
3. WHEN a user selects an image file, THE Photo_Uploader SHALL validate the file type before upload
4. WHEN a user selects an image file, THE Photo_Uploader SHALL display a preview of the image
5. WHEN a user uploads a photo, THE system SHALL call uploadToCloudinary with the selected file
6. WHEN the upload succeeds, THE system SHALL store the returned URL in the photoUrl field
7. WHEN the upload fails, THE system SHALL display the error message from uploadToCloudinary

### Requirement 4: Profile Photo Display

**User Story:** As a user, I want to see my profile photo on the Dashboard, so that I can verify my profile appearance.

#### Acceptance Criteria

1. WHEN a user has a photoUrl, THE Dashboard SHALL display the profile photo
2. WHEN a user has no photoUrl, THE Dashboard SHALL display a default avatar placeholder
3. THE Dashboard SHALL display the profile photo with appropriate sizing and styling
4. THE profile photo SHALL be displayed in a circular or rounded format

### Requirement 5: Profile Data Persistence

**User Story:** As a user, I want my profile changes to be saved to Firestore, so that my updates are preserved across sessions.

#### Acceptance Criteria

1. WHEN a user clicks save, THE Profile_Service SHALL update the Firestore document in the users collection
2. THE Profile_Service SHALL update the document using the authenticated user's uid as the document ID
3. WHEN the update succeeds, THE system SHALL display a success message
4. WHEN the update fails, THE system SHALL display an error message with details
5. WHEN the update succeeds, THE system SHALL refresh the profile data to reflect changes

### Requirement 6: Loading and Error States

**User Story:** As a user, I want clear feedback during profile operations, so that I understand what is happening and can respond to errors.

#### Acceptance Criteria

1. WHEN the Profile_Editor is loading profile data, THE system SHALL display a loading indicator
2. WHEN a profile save operation is in progress, THE system SHALL disable the save button and show a loading state
3. WHEN a photo upload is in progress, THE system SHALL display an upload progress indicator
4. WHEN a profile operation fails, THE system SHALL display a user-friendly error message
5. WHEN a photo upload fails, THE system SHALL display the error message from the Cloudinary_Service
6. THE system SHALL clear error messages when the user retries an operation

### Requirement 7: Form Validation

**User Story:** As a user, I want validation feedback on my profile edits, so that I can correct errors before saving.

#### Acceptance Criteria

1. WHEN the name field is empty, THE system SHALL display a validation error message
2. WHEN the location field is empty, THE system SHALL display a validation error message
3. WHEN validation errors exist, THE system SHALL disable the save button
4. WHEN all validation errors are resolved, THE system SHALL enable the save button
5. THE system SHALL display validation errors inline with the relevant input fields

### Requirement 8: Navigation and Routing

**User Story:** As a user, I want to navigate to the profile edit page from the Dashboard, so that I can access the editing interface.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a button or link to navigate to the Profile_Editor
2. WHEN a user clicks the edit profile button, THE system SHALL navigate to the profile edit route
3. THE profile edit route SHALL be protected and require authentication
4. WHEN a user completes editing, THE system SHALL provide a way to return to the Dashboard
