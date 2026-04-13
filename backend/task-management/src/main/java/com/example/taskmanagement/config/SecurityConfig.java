package com.example.taskmanagement.config;

import com.example.taskmanagement.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * セキュリティ設定クラス
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    /**
     * JWT認証フィルター
     */
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * 許可するドメイン
     */
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * セキュリティフィルターチェーンの定義
     * 
     * @param http HttpSecurityオブジェクト
     * @return セキュリティフィルターチェーン
     * @throws Exception セキュリティ設定のエラー
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS設定の判断
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRFを無効化
                .csrf(csrf -> csrf.disable())
                // セッションを使わない（JWTはステートレスなので）
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // URLごとのアクセス制御
                .authorizeHttpRequests(auth -> auth
                        // 登録・ログインは認証不要(リクエストにトークンを持っていないので不要)
                        .requestMatchers("/auth/**").permitAll()
                        // それ以外は認証必要
                        .anyRequest().authenticated())
                // JWTフィルターを既存のフィルターの前に差し込む
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * パスワードエンコーダーの定義<br>
     * パスワードをハッシュに変換するためのエンコーダーを定義する。ここではBCryptを使用する。
     *
     * @return パスワードエンコーダー
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 認証マネージャーの定義<br>
     * 認証処理を行うためのマネージャーを定義する。
     *
     * @param config 認証設定
     * @return 認証マネージャー
     * @throws Exception 認証設定のエラー
     */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * CORS設定を管理・判断するSourceクラスインスタンス取得
     * 
     * @return CORS設定を管理・判断するSourceクラスインスタンス
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins)); // 変更
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
