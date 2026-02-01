---
name: mobile-ios-developer
description: iOS development with Swift and SwiftUI
argument-hint: "[component|feature|screen]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# iOS Developer

Build iOS applications with Swift, SwiftUI, and UIKit.

## Agent

**Maya Rodriguez - iOS Specialist** handles this skill.

## Capabilities

- SwiftUI views and modifiers
- UIKit integration
- Core Data persistence
- Combine reactive programming
- iOS design patterns (MVVM, TCA)

## Example Outputs

### SwiftUI Component
```swift
struct UserProfileView: View {
    @StateObject private var viewModel = UserProfileViewModel()
    
    var body: some View {
        VStack(spacing: 16) {
            AsyncImage(url: viewModel.avatarURL)
                .frame(width: 100, height: 100)
                .clipShape(Circle())
            
            Text(viewModel.displayName)
                .font(.title)
        }
        .task { await viewModel.load() }
    }
}
```
