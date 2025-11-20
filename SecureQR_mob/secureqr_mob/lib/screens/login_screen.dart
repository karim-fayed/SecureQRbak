import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );

    setState(() => _isLoading = false);

    if (success && mounted) {
      context.go('/dashboard');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'فشل في تسجيل الدخول'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                // Logo
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.qr_code,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'SecureQR',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'تسجيل الدخول إلى حسابك',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Email field
                CustomTextField(
                  controller: _emailController,
                  label: 'البريد الإلكتروني',
                  hint: 'أدخل بريدك الإلكتروني',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'يرجى إدخال البريد الإلكتروني';
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                      return 'يرجى إدخال بريد إلكتروني صحيح';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password field
                CustomTextField(
                  controller: _passwordController,
                  label: 'كلمة المرور',
                  hint: 'أدخل كلمة المرور',
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'يرجى إدخال كلمة المرور';
                    }
                    if (value.length < 6) {
                      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
                    }
                    return null;
                  },
                ),
/*                 const SizedBox(height: 8),
                // Pre-fill button for testing
                TextButton(
                  onPressed: () {
                    _emailController.text = 'karim-it@outlook.sa';
                    _passwordController.text = 'SecureQR@2024';
                  },
                  child: const Text('استخدام بيانات تجريبية'),
                ), */
                const SizedBox(height: 24),

                // Login button
                CustomButton(
                  text: 'تسجيل الدخول',
                  onPressed: _isLoading ? null : _login,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 16),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'ليس لديك حساب؟ ',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/register');
                      },
                      child: const Text('إنشاء حساب'),
                    ),
                  ],
                ),

                // Forgot password link
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed('/forgot-password');
                  },
                  child: const Text('نسيت كلمة المرور؟'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
