import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Car, Mail, Lock, User, ArrowLeft } from 'lucide-react';

const Auth = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const emailRedirectTo = `${window.location.origin}/auth`;

    useEffect(() => {
        const handleEmailConfirmationCallback = async () => {
            const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
            const queryParams = new URLSearchParams(window.location.search);

            const callbackError =
                hashParams.get('error_description') ||
                queryParams.get('error_description');

            if (callbackError) {
                toast.error(decodeURIComponent(callbackError));
                return;
            }

            const code = queryParams.get('code');
            const hasTokenInHash = !!hashParams.get('access_token');

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    toast.error(`Email verification failed: ${error.message}`);
                    return;
                }
            }

            if (code || hasTokenInHash) {
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error) {
                    toast.error('Email was confirmed, but we could not fetch your account. Please sign in manually.');
                    return;
                }

                if (user?.email_confirmed_at) {
                    toast.success('Email verified successfully. You are now signed in.');
                    window.history.replaceState({}, document.title, window.location.pathname);
                    navigate('/');
                    return;
                }

                toast.warning('Verification link opened, but email is still unverified. Try the latest email link.');
            }
        };

        void handleEmailConfirmationCallback();
    }, [navigate]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            toast.success('Signed in successfully!');
            navigate('/');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to sign in';
            if (message.toLowerCase().includes('invalid login credentials')) {
                toast.error('Invalid login credentials. If you just signed up, verify your email first or resend verification email.');
            } else if (message.toLowerCase().includes('email not confirmed')) {
                toast.error('Your email is not verified yet. Open the latest verification email or resend it below.');
            } else {
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo,
                    data: {
                        display_name: displayName,
                    },
                },
            });
            if (error) throw error;
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                toast.info('Account already exists. Try signing in, or use resend verification below.');
            } else {
                toast.success('Check your email for the confirmation link! If it is missing, check spam or click resend below.');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to sign up';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            toast.error('Enter your email address first.');
            return;
        }

        setIsResending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo,
                },
            });

            if (error) throw error;
            toast.success('Verification email sent again. Check spam/promotions if needed.');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to resend verification email';
            toast.error(message);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]"></div>
            </div>

            <Button
                variant="ghost"
                className="absolute top-8 left-8 z-10"
                onClick={() => navigate('/')}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
            </Button>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 glow-effect">
                        <Car className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-foreground">
                        Park<span className="text-primary">Smart</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">Your gateway to hassle-free parking</p>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-secondary rounded-xl">
                        <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                        <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="glass-card border-border border-2">
                            <CardHeader>
                                <CardTitle>Welcome Back</CardTitle>
                                <CardDescription>Enter your credentials to access your account</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignIn}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-10"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="password">Password</Label>
                                            <Button variant="link" className="px-0 h-auto text-xs font-normal" type="button">Forgot password?</Button>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                className="pl-10"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <div className="w-full space-y-3">
                                        <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                            ) : null}
                                            {isLoading ? 'Signing in...' : 'Sign In'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleResendVerification}
                                            disabled={isResending}
                                        >
                                            {isResending ? 'Resending...' : 'Did not get verification email? Resend'}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register">
                        <Card className="glass-card border-border border-2">
                            <CardHeader>
                                <CardTitle>Create Account</CardTitle>
                                <CardDescription>Enter your details to register for ParkSmart</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSignUp}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="reg-name"
                                                placeholder="John Doe"
                                                className="pl-10"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-email">Email address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="reg-email"
                                                type="email"
                                                placeholder="name@example.com"
                                                className="pl-10"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="reg-password"
                                                type="password"
                                                className="pl-10"
                                                placeholder="Minimum 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <div className="w-full space-y-3">
                                        <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                            ) : null}
                                            {isLoading ? 'Creating account...' : 'Create Account'}
                                        </Button>
                                        {isLoading ? (
                                            <p className="text-xs text-muted-foreground text-center">Sending verification email...</p>
                                        ) : null}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleResendVerification}
                                            disabled={isResending}
                                        >
                                            {isResending ? 'Resending...' : 'Resend verification email'}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Auth;
