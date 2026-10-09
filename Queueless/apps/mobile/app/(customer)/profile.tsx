import React from 'react';
import { Redirect } from 'expo-router';

export default function ProfileRedirect() {
  return <Redirect href="/(customer)/settings" />;
}
