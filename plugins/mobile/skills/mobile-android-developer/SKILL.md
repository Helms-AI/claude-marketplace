---
name: mobile-android-developer
description: Android development with Kotlin and Jetpack Compose
argument-hint: "[component|feature|screen]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Android Developer

Build Android applications with Kotlin and Jetpack Compose.

## Agent

**Kenji Tanaka - Android Specialist** handles this skill.

## Capabilities

- Jetpack Compose UI
- MVVM architecture
- Kotlin Coroutines & Flow
- Room database
- Hilt dependency injection

## Example Outputs

### Compose Component
```kotlin
@Composable
fun UserProfileScreen(
    viewModel: UserProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    Column(
        modifier = Modifier.padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AsyncImage(
            model = uiState.avatarUrl,
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
        )
        
        Text(
            text = uiState.displayName,
            style = MaterialTheme.typography.headlineMedium
        )
    }
}
```
