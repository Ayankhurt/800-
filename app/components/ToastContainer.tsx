import React from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from './Toast';
import { useToast } from '@/hooks/useToast';

const ToastContainer: React.FC = () => {
    const { toasts, dismissToast } = useToast();

    return (
        <View style={styles.container} pointerEvents="box-none">
            {toasts.map((toast, index) => (
                <View
                    key={toast.id}
                    style={[styles.toastWrapper, { top: 50 + index * 80 }]}
                >
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        visible={toast.visible}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
    toastWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
});

export default ToastContainer;
