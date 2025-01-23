class AuthService {
  // Mock user database
  final Map<String, String> _users = {};

  Future<void> signIn(String email, String password) async {
    if (_users.containsKey(email) && _users[email] == password) {
      // Simulate successful login
      return;
    } else {
      throw Exception('Login failed: Invalid email or password');
    }
  }

  Future<void> register(String email, String password) async {
    if (_users.containsKey(email)) {
      throw Exception('Registration failed: Email already exists');
    } else {
      // Simulate successful registration
      _users[email] = password;
      return;
    }
  }

  Future<void> signOut() async {
    // Simulate sign out
    return;
  }
}