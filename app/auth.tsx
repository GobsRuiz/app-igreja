/**
 * Auth Screen
 * Página única que alterna entre Login e Cadastro
 */

import { useAuth } from '@features/auth';
import { Button, toast } from '@shared/ui';
import { Eye, EyeOff, Lock, Mail } from '@tamagui/lucide-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Input, Separator, Text, XStack, YStack } from 'tamagui';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp, loading } = useAuth();

  // Estado do formulário
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Limpar formulário ao trocar de modo
  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setPassword('');
    setConfirmPassword('');
  };

  // Limpar erros ao digitar
  const handleEmailChange = (text: string) => {
    setEmail(text.trim().toLowerCase());
  };

  // Submit do formulário
  const handleSubmit = async () => {
    if (mode === 'login') {
      const { error } = await signIn(email, password);

      if (error) {
        toast.error(error);
        return;
      }

      // Sucesso - _layout.tsx fará o redirect automaticamente
    } else {
      const { error } = await signUp(email, password, confirmPassword);

      if (error) {
        toast.error(error);
        return;
      }

      // Sucesso - _layout.tsx fará o redirect automaticamente
    }
  };

  const isLoginMode = mode === 'login';

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <YStack flex={1} backgroundColor="$background" paddingHorizontal="$4" justifyContent="center">
        <Card
          elevate
          size="$4"
          bordered
          animation="quick"
          scale={0.9}
          hoverStyle={{ scale: 0.925 }}
          pressStyle={{ scale: 0.875 }}
          padding="$6"
          gap="$4"
        >
          {/* Header com Toggle */}
          <YStack gap="$3" alignItems="center">
            <Text fontSize="$8" fontWeight="700" color="$color12">
              {isLoginMode ? 'Bem-vindo!' : 'Criar conta'}
            </Text>
            <Text fontSize="$4" color="$color11" textAlign="center">
              {isLoginMode
                ? 'Faça login para continuar'
                : 'Cadastre-se para começar'}
            </Text>
          </YStack>

          <Separator marginVertical="$2" />

          {/* Toggle Login/Cadastro */}
          <XStack gap="$2">
            <Button
              flex={1}
              size="$4"
              variant={isLoginMode ? 'outlined' : undefined}
              backgroundColor={isLoginMode ? '$color12' : 'transparent'}
              color={isLoginMode ? '$color1' : '$color11'}
              borderColor="$borderColor"
              onPress={() => setMode('login')}
              disabled={loading}
            >
              Login
            </Button>
            <Button
              flex={1}
              size="$4"
              variant={!isLoginMode ? 'outlined' : undefined}
              backgroundColor={!isLoginMode ? '$color12' : 'transparent'}
              color={!isLoginMode ? '$color1' : '$color11'}
              borderColor="$borderColor"
              onPress={() => setMode('signup')}
              disabled={loading}
            >
              Cadastro
            </Button>
          </XStack>

          {/* Formulário */}
          <YStack gap="$3" marginTop="$2">
            {/* Email */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color12">
                E-mail
              </Text>
              <XStack
                alignItems="center"
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                height={50}
              >
                <Mail size={18} color="$color11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  paddingLeft="$3"
                />
              </XStack>
            </YStack>

            {/* Senha */}
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color12">
                Senha
              </Text>
              <XStack
                alignItems="center"
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                height={50}
              >
                <Lock size={18} color="$color11" />
                <Input
                  flex={1}
                  unstyled
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  paddingLeft="$3"
                />
                <Button
                  variant="transparent"
                  onPress={() => setShowPassword(!showPassword)}
                  padding="$2"
                  disabled={loading}
                  paddingHorizontal="$0"
                  paddingVertical="$0"
                >
                  {showPassword ? (
                    <EyeOff size={18} color="$color11" />
                  ) : (
                    <Eye size={18} color="$color11" />
                  )}
                </Button>
              </XStack>
            </YStack>

            {/* Confirmar Senha (apenas Cadastro) */}
            {!isLoginMode && (
              <YStack gap="$2">
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  Confirmar senha
                </Text>
                <XStack
                  alignItems="center"
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  height={50}
                >
                  <Lock size={18} color="$color11" />
                  <Input
                    flex={1}
                    unstyled
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    paddingLeft="$3"
                  />
                  <Button
                    variant="transparent"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    padding="$2"
                    disabled={loading}
                     paddingHorizontal="$0"
                    paddingVertical="$0"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="$color11" />
                    ) : (
                      <Eye size={18} color="$color11" />
                    )}
                  </Button>
                </XStack>
              </YStack>
            )}
          </YStack>

          {/* Botão Submit */}
          <Button
            variant="primary"
            size="$5"
            fontWeight="600"
            marginTop="$3"
            onPress={handleSubmit}
            disabled={loading || !email || !password || (!isLoginMode && !confirmPassword)}
            opacity={loading || !email || !password || (!isLoginMode && !confirmPassword) ? 0.5 : 1}
          >
            {loading ? 'Carregando...' : isLoginMode ? 'Entrar' : 'Criar conta'}
          </Button>

          {/* Link alternativo */}
          <XStack justifyContent="center" alignItems="center" gap="$2" marginTop="$2">
            <Text fontSize="$3" color="$color11">
              {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </Text>
            <Button
              variant="transparent"
              onPress={toggleMode}
              disabled={loading}
              paddingHorizontal="$0"
              paddingVertical="$0"
            >
              <Text fontSize="$3" fontWeight="600" color="$color12">
                {isLoginMode ? 'Cadastre-se' : 'Faça login'}
              </Text>
            </Button>
          </XStack>
        </Card>
      </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
