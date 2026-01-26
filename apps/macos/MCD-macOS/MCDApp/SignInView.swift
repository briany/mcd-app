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
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)

                    Text("Sign in to access your coupons")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }

                Spacer()

                // GitHub Device Flow UI
                if authManager.isWaitingForDeviceAuth,
                   let userCode = authManager.deviceFlowUserCode {
                    VStack(spacing: 16) {
                        Text("Enter this code on GitHub:")
                            .font(.subheadline)
                            .foregroundColor(.gray)

                        Text(userCode)
                            .font(.system(size: 32, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color(white: 0.2))
                            .cornerRadius(12)
                            .textSelection(.enabled)

                        if let verificationURL = authManager.deviceFlowVerificationURL {
                            Button(action: {
                                if let url = URL(string: verificationURL) {
                                    NSWorkspace.shared.open(url)
                                }
                            }) {
                                HStack {
                                    Image(systemName: "safari")
                                    Text("Open GitHub")
                                }
                                .font(.footnote)
                            }
                            .buttonStyle(.link)
                        }

                        Text("Waiting for authorization...")
                            .font(.caption)
                            .foregroundColor(.gray)

                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(0.8)
                    }
                    .padding()
                    .background(Color(white: 0.15))
                    .cornerRadius(16)
                    .padding(.horizontal, 24)
                } else {
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
                            .frame(maxWidth: 280)
                            .padding(.vertical, 12)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.white)
                        .foregroundColor(.black)
                        .disabled(authManager.isLoading)

                        Button(action: {
                            Task {
                                await authManager.signIn(provider: .github)
                            }
                        }) {
                            HStack(spacing: 12) {
                                Image(systemName: "chevron.left.forwardslash.chevron.right")
                                    .font(.title2)
                                Text("Continue with GitHub")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: 280)
                            .padding(.vertical, 12)
                        }
                        .buttonStyle(.bordered)
                        .tint(.gray)
                        .disabled(authManager.isLoading)
                    }
                    .opacity(authManager.isLoading ? 0.6 : 1.0)

                    if authManager.isLoading && !authManager.isWaitingForDeviceAuth {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(0.8)
                            .padding(.top, 8)
                    }
                }

                Spacer()
                    .frame(height: 60)
            }
            .frame(maxWidth: 400)
        }
        .frame(minWidth: 500, minHeight: 400)
    }
}

#Preview {
    SignInView()
}
