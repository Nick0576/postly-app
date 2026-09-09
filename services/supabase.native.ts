// Postly Social — https://github.com/postly-app/postly-social-mobile
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clean the URL to prevent "Invalid path" errors by removing trailing slashes and /rest/v1
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || "")
  .trim()
  .replace(/\/$/, "")
  .replace(/\/rest\/v1$/, "");

const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});