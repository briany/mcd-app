import SwiftUI
import MCDCore

struct SignInView: View {
    @ObservedObject private var authManager = AuthManager.shared

    var body: some View {
        ZStack {
            Color(red: 0.1, green: 0.1, blue: 0.15)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Logo/Title
                VStack(spacing: 8) {
                    Image(systemName: "fork.knife.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.yellow)

                    Text("McDonald's MCP")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("Sign in to access your coupons")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }

                Spacer()

                // Error message
                if let error = authManager.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .padding(.horizontal)
                        .multilineTextAlignment(.center)
                }

                // Sign in buttons
                VStack(spacing: 12) {
                    Button(action: {
                        Task {
                            await authManager.signIn(provider: .google)
                        }
                    }) {
                        HStack(spacing: 12) {
                            Image(systemName: "g.circle.fill")
                                .font(.title2)
                            Text("Continue with Google")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .foregroundColor(.black)
                        .cornerRadius(12)
                    }
                    .disabled(authManager.isLoading)

                    Button(action: {
                        Task {
                            await authManager.signIn(provider: .github)
                        }
                    }) {
                        HStack(spacing: 12) {
                            Image(systemName: "apple.terminal.fill")
                                .font(.title2)
                            Text("Continue with GitHub")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color(white: 0.15))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                    }
                    .disabled(authManager.isLoading)
                }
                .padding(.horizontal, 24)
                .opacity(authManager.isLoading ? 0.6 : 1.0)

                if authManager.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .padding(.top, 8)
                }

                Spacer()
                    .frame(height: 60)
            }
        }
    }
}

#Preview {
    SignInView()
}
